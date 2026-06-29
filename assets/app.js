/**
 * NCE-Flow-Plus 主应用逻辑
 * 集成点读、跟读、评分功能
 */

class NCEApp {
  constructor() {
    this.audioPlayer = new AudioPlayer();
    this.recorder = new AudioRecorder();
    this.scorer = new PronunciationScorer();
    this.currentBook = null;
    this.currentLesson = null;
    this.currentSentence = null;
    this.isPlaying = false;
    this.speed = 1.0;
    this.loopMode = false;
    this.theme = 'auto';
    this.isFollowReading = false;
    this.sentences = [];
    this.history = this.loadHistory();
  }

  /**
   * 初始化应用
   */
  async init() {
    console.log('🚀 NCE-Flow-Plus 初始化...');

    // 1. 初始化主题
    this.initTheme();

    // 2. 设置音频播放器回调
    this.audioPlayer.onSentenceChange((index) => {
      this.highlightSentence(index);
    });
    this.audioPlayer.onEnd(() => {
      this.isPlaying = false;
      this.updatePlayUI();
    });
    this.audioPlayer.onStateChange((state) => {
      this.isPlaying = (state === 'playing');
      this.updatePlayUI();
    });
    this.audioPlayer.onError((msg) => {
      this.isPlaying = false;
      this.updatePlayUI();
      this.showNotification('播放失败：' + msg, 'error');
    });

    // 3. 加载课文数据
    const hash = window.location.hash;
    if (!hash || hash === '#') {
      this.showNoLessonState();
      this.bindEvents();
      return;
    }

    document.getElementById('loadingMessage').style.display = 'block';

    try {
      const lessonData = await LessonLoader.load();
      this.currentBook = lessonData.bookDir;
      this.sentences = lessonData.sentences;

      // 加载音频
      this.audioPlayer.load(lessonData.mp3Path, lessonData.sentences);

      // 渲染句子列表
      this.renderSentences();

      // 更新导航标题
      document.getElementById('navTitle').textContent = lessonData.title;

      // 更新播放控制栏的音频来源信息
      document.getElementById('loadingMessage').style.display = 'none';
    } catch (error) {
      console.error('❌ 课文加载失败:', error);
      document.getElementById('loadingMessage').style.display = 'none';
      this.showError('加载课文失败：' + error.message);
    }

    // 4. 绑定事件
    this.bindEvents();

    console.log('✅ 应用初始化完成');
  }

  /**
   * 渲染句子列表
   */
  renderSentences() {
    const container = document.getElementById('sentencesList');
    container.innerHTML = '';

    this.sentences.forEach((sentence, index) => {
      const item = document.createElement('div');
      item.className = 'sentence-item';
      item.dataset.sentenceIndex = index;
      item.dataset.originalText = sentence.en;

      item.innerHTML = `
        <div class="sentence-header">
          <span class="sentence-number">${index + 1}</span>
          <button class="play-sentence-btn" title="播放此句">▶</button>
          <button class="follow-read-btn" title="跟读此句">🎤 跟读</button>
        </div>
        <div class="sentence-content">
          <div class="text-en">${this.escapeHtml(sentence.en)}</div>
          <div class="text-cn" style="display: none;">${this.escapeHtml(sentence.cn)}</div>
        </div>
        <div class="sentence-actions">
          <button class="action-btn favorite-btn" title="收藏">☆</button>
          <button class="action-btn" title="加入清单">📋</button>
        </div>
        <div class="score-result" style="display: none;">
          <div class="score-badge">📊 上次评分：<span class="score-value">--</span> 分</div>
          <button class="view-detail-btn">查看详情</button>
        </div>
      `;

      container.appendChild(item);

      // 恢复之前的评分记录
      this.restoreScoreRecord(index, item);
    });
  }

  /**
   * 恢复评分记录
   */
  restoreScoreRecord(index, item) {
    const record = this.history.records
      ?.filter(r => r.sentenceIndex === index)
      ?.sort((a, b) => b.timestamp - a.timestamp)?.[0];
    if (record && record.score > 0) {
      const scoreEl = item.querySelector('.score-result');
      if (scoreEl) {
        scoreEl.style.display = 'block';
        scoreEl.querySelector('.score-value').textContent = record.score;
      }
    }
  }

  /**
   * HTML 转义
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 播放指定句子（点读）
   */
  playSentence(index) {
    if (index < 0 || index >= this.sentences.length) return;
    this.currentSentence = index;
    this.audioPlayer.playSentence(index);
    this.highlightSentence(index);
  }

  /**
   * 高亮当前句子
   */
  highlightSentence(index) {
    document.querySelectorAll('.sentence-item').forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });
  }

  /**
   * 播放原音
   */
  playOriginal(sentenceIndex) {
    this.audioPlayer.playSentence(sentenceIndex);
  }

  /**
   * 播放跟读录音
   */
  playRecording(sentenceIndex) {
    const audio = this.recorder.playRecording();
    if (!audio) {
      this.showNotification('没有可播放的录音', 'warning');
    }
  }

  /**
   * 切换跟读
   */
  toggleFollowRead(sentenceIndex, originalText) {
    if (this.isFollowReading) {
      // 已经在跟读中，手动停止
      this._cancelFollowRead(sentenceIndex);
    } else {
      this.startFollowRead(sentenceIndex, originalText);
    }
  }

  /**
   * 开始跟读
   */
  async startFollowRead(sentenceIndex, originalText) {
    if (this.isFollowReading) return;
    if (!originalText) {
      originalText = this.sentences[sentenceIndex]?.en || '';
    }

    console.log('🎤 开始跟读:', sentenceIndex, originalText);

    this.currentSentence = sentenceIndex;
    this.isFollowReading = true;
    this.updateFollowReadUI(sentenceIndex, 'recording');

    try {
      // Step 1: 播放提示音
      this.playBeep();
      await this._sleep(400);

      // Step 2: 初始化录音器（需要用户手势上下文）
      if (!this.recorder.stream) {
        await this.recorder.init();
      }

      // Step 3: 开始录音和语音识别
      await this.recorder.startRecording();

      // 初始化评分器（如果需要）
      try {
        this.scorer.startRecognition(originalText);
      } catch (e) {
        console.warn('⚠ 语音识别不可用:', e.message);
      }

      // Step 4: 等待语音识别结束（用户停止说话或超时）
      await this._waitForRecognition(10000);

      // Step 5: 停止并获取结果
      await this.stopFollowRead(sentenceIndex);
    } catch (error) {
      console.error('❌ 跟读失败:', error);
      this.showNotification('跟读失败：' + error.message, 'error');
      this.isFollowReading = false;
      this.updateFollowReadUI(sentenceIndex, 'idle');
    }
  }

  /**
   * 停止跟读
   */
  async stopFollowRead(sentenceIndex) {
    console.log('🎤 停止跟读:', sentenceIndex);

    // 停止录音
    const audioBlob = await this.recorder.stopRecording();

    // 获取评分结果（已在 scorer.onend 中自动计算）
    const scoreResult = this.scorer.getScore();

    // 保存录音
    if (audioBlob) {
      this.saveRecording(sentenceIndex, audioBlob);
    }

    // 显示评分结果
    if (scoreResult && scoreResult.score > 0) {
      this.showScoreResult(sentenceIndex, scoreResult);
    } else if (scoreResult && scoreResult.recognizedText) {
      this.showScoreResult(sentenceIndex, scoreResult);
    } else {
      this.showNotification('未检测到语音，请重试', 'warning');
    }

    // 更新 UI
    this.isFollowReading = false;
    this.updateFollowReadUI(sentenceIndex, 'scored');

    // 保存学习记录
    if (scoreResult) {
      this.saveLearningRecord(sentenceIndex, scoreResult);
    }
  }

  /**
   * 取消跟读
   */
  async _cancelFollowRead(sentenceIndex) {
    if (this.scorer.isListening) {
      this.scorer.stopRecognition();
    }
    await this.recorder.stopRecording();
    this.isFollowReading = false;
    this.updateFollowReadUI(sentenceIndex, 'idle');
    this.showNotification('跟读已取消', 'info');
  }

  /**
   * 等待语音识别结束
   */
  _waitForRecognition(timeout) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = setInterval(() => {
        if (!this.scorer.isListening || (Date.now() - start) > timeout) {
          clearInterval(check);
          if (this.scorer.isListening) {
            this.scorer.stopRecognition();
          }
          resolve();
        }
      }, 200);
    });
  }

  /**
   * 暂停工具函数
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 播放提示音
   */
  playBeep() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (e) {
      console.warn('⚠ 提示音播放失败:', e.message);
    }
  }

  /**
   * 更新跟读按钮 UI
   */
  updateFollowReadUI(sentenceIndex, state) {
    const btn = document.querySelector(`[data-sentence-index="${sentenceIndex}"] .follow-read-btn`);
    if (!btn) return;

    switch (state) {
      case 'idle':
        btn.textContent = '🎤 跟读';
        btn.disabled = false;
        btn.classList.remove('recording');
        break;
      case 'recording':
        btn.textContent = '🔴 录音中...';
        btn.disabled = false;
        btn.classList.add('recording');
        break;
      case 'scored':
        btn.textContent = '🎤 重新跟读';
        btn.disabled = false;
        btn.classList.remove('recording');
        break;
    }
  }

  /**
   * 显示评分结果弹窗
   */
  showScoreResult(sentenceIndex, result) {
    // 移除已有弹窗
    document.querySelectorAll('.score-modal').forEach(m => m.remove());

    const modal = document.createElement('div');
    modal.className = 'score-modal';
    modal.innerHTML = `
      <div class="score-modal-content">
        <h3>📊 发音评分</h3>
        <div class="score-circle ${this.getScoreLevel(result.score)}">
          <span class="score-number">${result.score}</span>
          <span class="score-label">分</span>
        </div>
        <div class="score-details">
          <p><strong>识别文本：</strong>${result.recognizedText || '(无)'}</p>
          <p><strong>文本相似度：</strong>${(result.textSimilarity || 0).toFixed(1)}%</p>
          <p><strong>置信度：</strong>${((result.confidence || 0) * 100).toFixed(1)}%</p>
        </div>
        <div class="score-feedback">
          <p>${(result.feedback || '').replace(/\n/g, '<br>')}</p>
        </div>
        <div class="score-actions">
          <button onclick="app.playOriginal(${sentenceIndex})">🔊 听原音</button>
          <button onclick="app.playRecording(${sentenceIndex})">🎤 听跟读</button>
          <button class="close-score-btn">关闭</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 关闭按钮
    modal.querySelector('.close-score-btn').addEventListener('click', () => modal.remove());

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  /**
   * 获取评分等级 CSS 类名
   */
  getScoreLevel(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    if (score >= 40) return 'poor';
    return 'very-poor';
  }

  /**
   * 保存录音
   */
  saveRecording(sentenceIndex, audioBlob) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const base64Audio = reader.result;
        localStorage.setItem(`recording_${sentenceIndex}`, base64Audio);
        console.log('✅ 录音已保存:', sentenceIndex);
      } catch (e) {
        console.warn('⚠ 录音保存失败（可能超出存储空间）:', e.message);
      }
    };
    reader.readAsDataURL(audioBlob);
  }

  /**
   * 保存学习记录
   */
  saveLearningRecord(sentenceIndex, scoreResult) {
    const record = {
      sentenceIndex,
      score: scoreResult ? scoreResult.score : 0,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };

    if (!this.history.records) {
      this.history.records = [];
    }

    this.history.records.push(record);

    // 只保留最近 1000 条
    if (this.history.records.length > 1000) {
      this.history.records = this.history.records.slice(-1000);
    }

    this.saveHistory();

    // 更新页面上该句子的评分显示
    const item = document.querySelector(`[data-sentence-index="${sentenceIndex}"]`);
    if (item) {
      const scoreEl = item.querySelector('.score-result');
      if (scoreEl) {
        scoreEl.style.display = 'block';
        scoreEl.querySelector('.score-value').textContent = record.score;
      }
    }
  }

  /**
   * 显示通知
   */
  showNotification(message, type = 'info') {
    // 移除已有通知
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * 初始化主题
   */
  initTheme() {
    const savedTheme = localStorage.getItem('nce-theme') || 'auto';
    this.theme = savedTheme;
    this.applyTheme();
  }

  /**
   * 切换主题
   */
  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
    localStorage.setItem('nce-theme', this.theme);
  }

  /**
   * 应用主题
   */
  applyTheme() {
    if (this.theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', this.theme);
    }
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 使用事件委托

    // 播放句子按钮
    document.addEventListener('click', (e) => {
      if (e.target.matches('.play-sentence-btn') || e.target.closest('.play-sentence-btn')) {
        const btn = e.target.matches('.play-sentence-btn') ? e.target : e.target.closest('.play-sentence-btn');
        const item = btn.closest('[data-sentence-index]');
        if (item) {
          const index = parseInt(item.dataset.sentenceIndex);
          this.playSentence(index);
        }
      }
    });

    // 跟读按钮
    document.addEventListener('click', (e) => {
      if (e.target.matches('.follow-read-btn') || e.target.closest('.follow-read-btn')) {
        const btn = e.target.matches('.follow-read-btn') ? e.target : e.target.closest('.follow-read-btn');
        const item = btn.closest('[data-sentence-index]');
        if (item) {
          const index = parseInt(item.dataset.sentenceIndex);
          const text = item.dataset.originalText;
          this.toggleFollowRead(index, text);
        }
      }
    });

    // 主题切换
    document.addEventListener('click', (e) => {
      if (e.target.matches('.theme-toggle') || e.target.closest('.theme-toggle')) {
        this.toggleTheme();
      }
    });

    // 播放控制
    document.getElementById('playBtn')?.addEventListener('click', () => {
      if (!this.sentences.length) {
        this.showNotification('没有课文数据，无法播放', 'warning');
        return;
      }
      this.audioPlayer.playFull();
    });

    document.getElementById('pauseBtn')?.addEventListener('click', () => {
      this.audioPlayer.pause();
    });

    // 倍速控制
    document.getElementById('speedSelect')?.addEventListener('change', (e) => {
      const speed = parseFloat(e.target.value);
      this.speed = speed;
      this.audioPlayer.setSpeed(speed);
    });

    // 循环模式
    document.getElementById('loopBtn')?.addEventListener('click', () => {
      this.loopMode = !this.loopMode;
      this.audioPlayer.setLoop(this.loopMode);
      document.getElementById('loopBtn').textContent =
        `🔁 循环：${this.loopMode ? '开' : '关'}`;
    });

    // 跟读模式切换
    document.getElementById('followReadToggle')?.addEventListener('click', () => {
      const btn = document.getElementById('followReadToggle');
      const isOn = btn.textContent.includes('开');
      btn.textContent = `🎤 跟读模式：${isOn ? '关' : '开'}`;
    });

    // 视图模式切换
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        document.querySelectorAll('.text-cn').forEach(el => {
          el.style.display = (mode === 'en') ? 'none' : 'block';
        });
        document.querySelectorAll('.text-en').forEach(el => {
          el.style.display = (mode === 'cn') ? 'none' : 'block';
        });
      });
    });

    // 收藏按钮
    document.addEventListener('click', (e) => {
      if (e.target.matches('.favorite-btn') || e.target.closest('.favorite-btn')) {
        const btn = e.target.matches('.favorite-btn') ? e.target : e.target.closest('.favorite-btn');
        btn.textContent = btn.textContent === '☆' ? '★' : '☆';
      }
    });
  }

  /**
   * 更新播放控制 UI
   */
  updatePlayUI() {
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
      playBtn.textContent = this.isPlaying ? '⏸ 暂停' : '▶ 播放';
    }
  }

  /**
   * 显示无课文状态
   */
  showNoLessonState() {
    document.getElementById('loadingMessage').style.display = 'block';
    document.getElementById('loadingMessage').innerHTML = `
      <div style="text-align:center; padding:3rem 1rem;">
        <p style="font-size:1.2rem; margin-bottom:1rem;">📖 请选择一课开始学习</p>
        <a href="index.html" style="color:var(--accent);">← 返回首页选择教材</a>
      </div>
    `;
  }

  /**
   * 显示错误
   */
  showError(message) {
    const el = document.getElementById('errorMessage');
    if (el) {
      el.style.display = 'block';
      document.getElementById('errorText').textContent = message;
    }
  }

  /**
   * 加载学习记录
   */
  loadHistory() {
    try {
      const saved = localStorage.getItem('nce-history');
      return saved ? JSON.parse(saved) : { records: [] };
    } catch (e) {
      return { records: [] };
    }
  }

  /**
   * 保存学习记录
   */
  saveHistory() {
    try {
      localStorage.setItem('nce-history', JSON.stringify(this.history));
    } catch (e) {
      console.warn('⚠ 学习记录保存失败');
    }
  }
}

// 初始化应用
let app;
(function initApp() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      app = new NCEApp();
      app.init();
    });
  } else {
    app = new NCEApp();
    app.init();
  }
})();

// 导出
window.NCEApp = NCEApp;
