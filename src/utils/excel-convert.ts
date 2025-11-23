import * as XLSX from "xlsx";
import * as cptable from "codepage";

// 设置 codepage 表，使 SheetJS 能够正确处理中文编码
if (typeof (XLSX as any).set_cptable === "function") {
  (XLSX as any).set_cptable(cptable);
}

/**
 * 把任意"看起来像 Excel"的文件转成 xlsx Blob
 * @param file 用户上传的 File
 */
export async function convertExcelToXlsx(file: File): Promise<Blob> {
  const ab = await file.arrayBuffer();
  let workbook: XLSX.WorkBook | undefined;
  const fileName = file.name.toLowerCase();

  // 1) 先按二进制尝试读取：支持 xls(biff2/3/4/5/8)、xlsx、xlsb、ods 等
  try {
    // 对于旧的 .xls 文件，使用 GBK 编码
    if (fileName.endsWith('.xls')) {
      workbook = XLSX.read(ab, {
        type: "array",
        cellDates: true,
        dense: false,
        WTF: false,
        codepage: 936, // 明确指定 GBK 编码用于旧格式 Excel 中文
        raw: false, // 不使用原始值，让 SheetJS 处理格式化
      });
    } else {
      // 对于 xlsx 等新格式，直接读取（它们本身就是 UTF-8）
      workbook = XLSX.read(ab, {
        type: "array",
        cellDates: true,
        dense: false,
        WTF: false,
        raw: false,
      });
    }
  } catch (err1) {
    // 如果特定编码失败，尝试自动检测
    try {
      workbook = XLSX.read(ab, {
        type: "array",
        cellDates: true,
        dense: false,
        WTF: false,
        raw: false,
      });
    } catch (err2) {
      // 2) 如果二进制都失败，再按文本兜底（很多系统把 CSV/HTML 改名成 .xls）
      try {
        const text = new TextDecoder("utf-8").decode(ab);
        workbook = XLSX.read(text, {
          type: "string", // 让 SheetJS 走 CSV/HTML 等文本解析
          cellDates: true,
          raw: false,
        });
      } catch (err3) {
        // 三条路都不行，说明文件确实不是可识别的表格
        throw new Error(
          `无法识别该Excel文件。可能是损坏文件或非标准导出。\n二进制解析错误: ${String(
            err1
          )}\n自动检测错误: ${String(err2)}\n文本兜底错误: ${String(err3)}`
        );
      }
    }
  }

  if (!workbook || workbook.SheetNames.length === 0) {
    throw new Error("文件中没有可用的工作表");
  }

  // 3) 写出为 xlsx（ArrayBuffer）
  // 确保所有单元格的值都是正确的 UTF-8 编码
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook!.Sheets[sheetName];
    if (!sheet) return;
    
    // 遍历所有单元格，确保字符串正确编码
    Object.keys(sheet).forEach(cellAddress => {
      if (cellAddress[0] === '!') return; // 跳过元数据
      const cell = sheet[cellAddress];
      if (cell && cell.t === 's' && typeof cell.v === 'string') {
        // 强制重新编码字符串值，确保 UTF-8
        cell.v = cell.v.toString();
      }
    });
  });

  const out = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    compression: true,
    bookSST: true, // 使用共享字符串表，提高中文兼容性
  });

  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/** 触发浏览器下载 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
