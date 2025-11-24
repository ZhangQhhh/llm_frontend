import * as XLSX from "xlsx";
import * as cptable from "codepage";

// 设置 codepage 表，使 SheetJS 能够正确处理中文编码
if (typeof (XLSX as any).set_cptable === "function") {
  (XLSX as any).set_cptable(cptable);
}

/**
 * 修复 GBK 乱码：将错误的 Latin-1 解释转换回正确的字符
 * 例如：Ö¤¼þÖÖÀà -> 证件种类
 */
function fixGBKEncoding(str: string): string {
  try {
    // 检测是否包含 Latin-1 扩展字符（À-ÿ）
    if (!/[À-ÿ]/.test(str)) {
      return str; // 没有乱码，直接返回
    }

    console.log(`[编码修复] 检测到可能的乱码: "${str}"`);

    // 将字符串转换为字节数组（假设是 Latin-1）
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i) & 0xFF);
    }

    // 方法1: 尝试使用 XLSX 内置的 codepage
    try {
      const xlsxCptable = (XLSX as any).cptable;
      if (xlsxCptable && xlsxCptable[936]) {
        let decoded: string | undefined;
        
        // 尝试不同的调用方式
        if (typeof xlsxCptable[936].dec === 'function') {
          decoded = xlsxCptable[936].dec(bytes);
        } else if (typeof xlsxCptable.utils?.decode === 'function') {
          decoded = xlsxCptable.utils.decode(936, bytes);
        }
        
        if (decoded && typeof decoded === 'string' && !decoded.includes('�') && decoded !== str) {
          console.log(`[编码修复] GBK 修复成功: "${str}" -> "${decoded}"`);
          return decoded;
        }
      }
    } catch (e) {
      console.warn('[编码修复] XLSX codepage 解码失败:', e);
    }

    // 方法2: 尝试使用导入的 cptable
    try {
      if (cptable && (cptable as any)[936]) {
        const cp936 = (cptable as any)[936];
        let decoded: string | undefined;
        
        if (typeof cp936.dec === 'function') {
          decoded = cp936.dec(bytes);
        } else if (typeof (cptable as any).utils?.decode === 'function') {
          decoded = (cptable as any).utils.decode(936, bytes);
        }
        
        if (decoded && typeof decoded === 'string' && !decoded.includes('�') && decoded !== str) {
          console.log(`[编码修复] cptable 修复成功: "${str}" -> "${decoded}"`);
          return decoded;
        }
      }
    } catch (e) {
      console.warn('[编码修复] cptable 解码失败:', e);
    }

    // 方法3: 尝试作为 UTF-8 重新解码
    try {
      const uint8Array = new Uint8Array(bytes);
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
      if (decoded && !decoded.includes('�') && decoded !== str) {
        console.log(`[编码修复] UTF-8 修复成功: "${str}" -> "${decoded}"`);
        return decoded;
      }
    } catch (e) {
      console.warn('[编码修复] UTF-8 解码失败:', e);
    }

    console.warn(`[编码修复] 无法修复: "${str}"`);
    return str; // 无法修复，返回原字符串
  } catch (e) {
    console.warn(`[编码修复] 编码修复异常: ${e}`);
    return str;
  }
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
  console.log(`[Excel转换] 开始读取文件: ${file.name}, 大小: ${file.size} bytes`);
  
  try {
    // 对于旧的 .xls 文件，使用 GBK 编码
    if (fileName.endsWith('.xls')) {
      console.log('[Excel转换] 检测到 .xls 文件，使用 GBK (codepage 936) 读取');
      workbook = XLSX.read(ab, {
        type: "array",
        cellDates: true,
        dense: false,
        WTF: false,
        codepage: 936, // 明确指定 GBK 编码用于旧格式 Excel 中文
        raw: false, // 不使用原始值，让 SheetJS 处理格式化
        cellText: false,
      });
      console.log('[Excel转换] .xls 文件读取成功');
    } else {
      // 对于 xlsx 等新格式，直接读取（它们本身就是 UTF-8）
      console.log('[Excel转换] 检测到 .xlsx 或其他格式，使用默认编码读取');
      workbook = XLSX.read(ab, {
        type: "array",
        cellDates: true,
        dense: false,
        WTF: false,
        raw: false,
      });
      console.log('[Excel转换] 文件读取成功');
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

  // 3) 修复编码问题并写出为 xlsx
  console.log(`[Excel转换] 工作表数量: ${workbook.SheetNames.length}`);
  console.log(`[Excel转换] 工作表名称: ${workbook.SheetNames.join(', ')}`);
  
  // 对所有文件都进行编码检查和修复
  let fixCount = 0;
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook!.Sheets[sheetName];
    if (!sheet) return;
    
    console.log(`[Excel转换] 检查工作表 "${sheetName}" 的编码...`);
    
    // 遍历所有单元格
    Object.keys(sheet).forEach(cellAddress => {
      if (cellAddress[0] === '!') return; // 跳过元数据
      const cell = sheet[cellAddress];
      if (cell && cell.t === 's' && typeof cell.v === 'string') {
        const original = cell.v;
        const fixed = fixGBKEncoding(cell.v);
        if (fixed !== original) {
          cell.v = fixed;
          cell.w = fixed; // 同时更新格式化文本
          fixCount++;
        }
      }
    });
  });
  
  if (fixCount > 0) {
    console.log(`[Excel转换] 共修复 ${fixCount} 个乱码单元格`);
  } else if (fileName.endsWith('.xls')) {
    console.log('[Excel转换] 未检测到需要修复的乱码');
    console.log('[Excel转换] 新格式文件，跳过编码修复');
  }

  console.log('[Excel转换] 开始写入 xlsx 文件...');
  const out = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    compression: true,
    bookSST: true, // 使用共享字符串表，提高中文兼容性
    cellDates: false, // 确保日期正确处理
  });
  console.log(`[Excel转换] 写入完成，输出大小: ${out.byteLength} bytes`);

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
