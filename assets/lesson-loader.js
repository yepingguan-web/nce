/**
 * 课文数据加载器
 * 从 URL hash 解析课文信息，加载 LRC 文件并解析句子数据
 */

/**
 * 安全编码文件路径中的每个段（正确处理 & 等特殊字符）
 * encodeURI 不会编码 &，但 & 在 URL 路径中会被误解析为查询分隔符
 * @param {string} path - 如 "NCE1/001&002－Excuse Me.mp3"
 * @returns {string} 编码后的路径
 */
function encodeURIPath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

class LessonLoader {
  /**
   * 从 URL hash 加载课文数据
   * @returns {Promise<{bookDir: string, title: string, mp3Path: string, lrcPath: string, sentences: Array}>}
   */
  static async load() {
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    if (!hash) {
      throw new Error('未指定课文。请从教材目录页面选择一课。');
    }

    // 分割 bookDir / lessonId
    const slashIdx = hash.indexOf('/');
    if (slashIdx === -1) {
      throw new Error('无效的课文链接格式');
    }

    const bookDir = hash.substring(0, slashIdx);
    const lessonId = hash.substring(slashIdx + 1);

    // 验证 bookDir
    const validBooks = ['NCE1', 'NCE2', 'NCE3', 'NCE4'];
    if (!validBooks.includes(bookDir)) {
      throw new Error(`无效的教材目录: ${bookDir}`);
    }

    // 构造文件路径
    const lrcPath = `${bookDir}/${lessonId}.lrc`;
    const mp3Path = `${bookDir}/${lessonId}.mp3`;

    // 加载 LRC 文件（编码特殊字符）
    let lrcText;
    try {
      const response = await fetch(encodeURIPath(lrcPath));
      if (!response.ok) {
        throw new Error(`LRC 文件不存在 (${response.status})`);
      }
      lrcText = await response.text();
    } catch (err) {
      if (err.message.includes('LRC 文件')) throw err;
      throw new Error(`无法加载课文数据: ${err.message}`);
    }

    // 解析句子数据
    const sentences = LrcParser.parse(lrcText);

    // 提取标题
    const title = LessonLoader._extractTitle(lrcText, lessonId);

    // 恢复页面标题
    document.title = `${title} - NCE-Flow-Plus`;

    return { bookDir, title, mp3Path, lrcPath, sentences };
  }

  /**
   * 获取当前课文的 hash 信息（不加载文件）
   * @returns {{bookDir: string, lessonId: string}|null}
   */
  static getHashInfo() {
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    if (!hash) return null;
    const slashIdx = hash.indexOf('/');
    if (slashIdx === -1) return null;
    return {
      bookDir: hash.substring(0, slashIdx),
      lessonId: hash.substring(slashIdx + 1)
    };
  }

  // ─── 内部方法 ───

  /**
   * 从 LRC 内容或文件名提取标题
   */
  static _extractTitle(lrcText, fallback) {
    // 尝试从 [ti:...] 标签提取
    const tiMatch = lrcText.match(/^\[ti:(.+)\]/m);
    if (tiMatch) return tiMatch[1].trim();

    // 回退：使用文件名
    // 移除前导数字和分隔符
    return fallback.replace(/^\d+[&]?\d*[－-]/, '').trim() || fallback;
  }
}

// 导出
window.LessonLoader = LessonLoader;
