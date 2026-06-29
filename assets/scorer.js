/**
 * 发音评分模块
 * 使用 Web Speech API 进行语音识别并评分
 */

class PronunciationScorer {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.recognizedText = '';
    this.confidence = 0;
    this.originalText = '';
    this.score = 0;
    this.feedback = '';
    
    // 检查浏览器支持
    this.isSupported = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  }

  /**
   * 初始化语音识别
   */
  init() {
    if (!this.isSupported) {
      throw new Error('您的浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // 配置
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US'; // 英语识别

    // 识别结果
    this.recognition.onresult = (event) => {
      const result = event.results[0][0];
      this.recognizedText = result.transcript;
      this.confidence = result.confidence;
      
      console.log('🎤 识别结果:', this.recognizedText);
      console.log('📊 置信度:', this.confidence);
    };

    // 识别结束
    this.recognition.onend = () => {
      this.isListening = false;
      console.log('✅ 语音识别已结束');
      
      // 自动评分
      if (this.originalText && this.recognizedText) {
        this.calculateScore();
      }
    };

    // 错误处理
    this.recognition.onerror = (event) => {
      console.error('❌ 语音识别错误:', event.error);
      this.isListening = false;
    };

    console.log('✅ 语音识别已初始化');
  }

  /**
   * 开始识别
   * @param {string} originalText - 原句文本
   */
  startRecognition(originalText) {
    if (!this.recognition) {
      this.init();
    }

    this.originalText = originalText;
    this.recognizedText = '';
    this.isListening = true;

    try {
      this.recognition.start();
      console.log('🎤 开始语音识别...');
    } catch (error) {
      console.error('❌ 启动语音识别失败:', error);
    }
  }

  /**
   * 停止识别
   */
  stopRecognition() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * 计算评分
   * @returns {Object} 评分结果
   */
  calculateScore() {
    if (!this.originalText || !this.recognizedText) {
      return null;
    }

    // 1. 文本相似度（Levenshtein 距离）
    const textSimilarity = this.calculateTextSimilarity(
      this.normalizeText(this.originalText),
      this.normalizeText(this.recognizedText)
    );

    // 2. 语音识别置信度
    const confidenceScore = this.confidence * 100;

    // 3. 综合评分（加权平均）
    this.score = Math.round(
      textSimilarity * 0.7 +  // 文本相似度权重 70%
      confidenceScore * 0.3     // 置信度权重 30%
    );

    // 4. 生成反馈
    this.feedback = this.generateFeedback(this.score, textSimilarity, confidenceScore);

    console.log('📊 评分结果:', {
      score: this.score,
      textSimilarity: textSimilarity.toFixed(2) + '%',
      confidence: confidenceScore.toFixed(2) + '%',
      feedback: this.feedback
    });

    return {
      score: this.score,
      textSimilarity: textSimilarity,
      confidence: confidenceScore,
      feedback: this.feedback,
      recognizedText: this.recognizedText
    };
  }

  /**
   * 计算文本相似度（使用 Levenshtein 距离）
   * @param {string} text1 - 文本1
   * @param {string} text2 - 文本2
   * @returns {number} 相似度 (0-100)
   */
  calculateTextSimilarity(text1, text2) {
    const distance = this.levenshteinDistance(text1, text2);
    const maxLength = Math.max(text1.length, text2.length);
    
    if (maxLength === 0) return 100;
    
    const similarity = (1 - distance / maxLength) * 100;
    return Math.max(0, similarity);
  }

  /**
   * Levenshtein 距离算法
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // 替换
            matrix[i][j - 1] + 1,     // 插入
            matrix[i - 1][j] + 1      // 删除
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 标准化文本（小写、去标点、去多余空格）
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // 去除标点
      .replace(/\s+/g, ' ')     // 合并空格
      .trim();
  }

  /**
   * 生成反馈建议
   * @param {number} score - 总分
   * @param {number} similarity - 文本相似度
   * @param {number} confidence - 置信度
   * @returns {string} 反馈文本
   */
  generateFeedback(score, similarity, confidence) {
    let feedback = '';

    if (score >= 90) {
      feedback = '🎉 发音非常棒！继续保持！';
    } else if (score >= 75) {
      feedback = '👍 发音很好！注意细节可以更完美。';
    } else if (score >= 60) {
      feedback = '💪 还不错，多练习会更好！';
    } else if (score >= 40) {
      feedback = '📈 继续加油，注意单词发音和连读。';
    } else {
      feedback = '🔄 建议多听原音，模仿发音和语调。';
    }

    // 添加具体建议
    if (similarity < 50) {
      feedback += '\n💡 建议：注意单词的完整性。';
    }
    if (confidence < 50) {
      feedback += '\n💡 建议：发音不够清晰，试着说得慢一点。';
    }

    return feedback;
  }

  /**
   * 获取评分结果
   */
  getScore() {
    return {
      score: this.score,
      feedback: this.feedback,
      recognizedText: this.recognizedText,
      confidence: this.confidence
    };
  }

  /**
   * 重置评分器
   */
  reset() {
    this.recognizedText = '';
    this.confidence = 0;
    this.score = 0;
    this.feedback = '';
  }
}

// 导出
window.PronunciationScorer = PronunciationScorer;
