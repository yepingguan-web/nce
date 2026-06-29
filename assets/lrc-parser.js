/**
 * LRC 歌词文件解析器
 * 解析 .lrc 文件中的时间戳和句子内容
 */

class LrcParser {
  /**
   * 解析 LRC 文本内容
   * @param {string} lrcText - LRC 文件原始文本
   * @returns {{startTime: number, endTime: number, en: string, cn: string}[]}
   */
  static parse(lrcText) {
    const lines = lrcText.split(/\r?\n/);
    const sentences = [];

    // 元数据标签正则
    const metaRE = /^\[(al|ar|ti|by|offset|length):/;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 跳过元数据行
      if (metaRE.test(trimmed)) continue;

      // 解析时间戳 [mm:ss.cc]
      const match = trimmed.match(/^\[(\d{2}):(\d{2})\.(\d{2})\]/);
      if (!match) continue;

      const startTime = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 100;

      // 提取文本内容（去掉时间戳部分）
      const text = trimmed.replace(/^\[\d{2}:\d{2}\.\d{2}\]/, '').trim();
      if (!text) continue;

      // 分割英文和中文（以 | 分隔）
      const parts = text.split('|');
      const en = (parts[0] || '').trim();
      const cn = (parts[1] || '').trim();

      sentences.push({ startTime, en, cn });
    }

    // 计算每句的 endTime（下一句的 startTime，最后一句 +3 秒）
    for (let i = 0; i < sentences.length; i++) {
      if (i < sentences.length - 1) {
        sentences[i].endTime = sentences[i + 1].startTime;
      } else {
        sentences[i].endTime = sentences[i].startTime + 3;
      }
    }

    return sentences;
  }
}

// 导出
window.LrcParser = LrcParser;
