import * as XLSX from "xlsx";

/**
 * 把任意"看起来像 Excel"的文件转成 xlsx Blob
 * @param file 用户上传的 File
 */
export async function convertExcelToXlsx(file: File): Promise<Blob> {
  const ab = await file.arrayBuffer();
  let workbook: XLSX.WorkBook | undefined;

  // 1) 先按二进制尝试读取：支持 xls(biff2/3/4/5/8)、xlsx、xlsb、ods 等
  try {
    workbook = XLSX.read(ab, {
      type: "array",
      cellDates: true,
      dense: false,
      WTF: false, // 不要抛太多内部异常
      // 让 SheetJS 自动检测编码，它会根据文件内容选择合适的 codepage
      // 对于中文 xls 文件，通常会自动使用 codepage 936 (GBK)
    });
  } catch (err1) {
    // 2) 如果二进制失败，再按文本兜底（很多系统把 CSV/HTML 改名成 .xls）
    try {
      const text = new TextDecoder("utf-8").decode(ab);
      workbook = XLSX.read(text, {
        type: "string", // 让 SheetJS 走 CSV/HTML 等文本解析
        cellDates: true,
        raw: false,
      });
    } catch (err2) {
      // 两条路都不行，说明文件确实不是可识别的表格
      throw new Error(
        `无法识别该Excel文件。可能是损坏文件或非标准导出。\n二进制解析错误: ${String(
          err1
        )}\n文本兜底错误: ${String(err2)}`
      );
    }
  }

  if (!workbook || workbook.SheetNames.length === 0) {
    throw new Error("文件中没有可用的工作表");
  }

  // 3) 写出为 xlsx（ArrayBuffer）
  const out = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    compression: true,
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
