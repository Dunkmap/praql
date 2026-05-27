/**
 * Progress Manager — Web version (localStorage only)
 */
export class ProgressManager {
  static _KEYS = [
    'userName', 'topicsCompleted', 'questionsSolved', 'questionsAttempted', 'solvedQuestionIds',
    'questionTimes', 'totalSolveTimeMs', 'dailyChallenge', 'streak', 'lastChallengeDate',
    'clausesMastered'
  ];

  static async getProgress() {
    const data = JSON.parse(localStorage.getItem('sqlmaster_progress') || '{}');
    return this._normalize(data);
  }

  static _normalize(data) {
    return {
      userName: data.userName || '',
      topicsCompleted: data.topicsCompleted || [],
      questionsSolved: data.questionsSolved || 0,
      questionsAttempted: data.questionsAttempted || 0,
      solvedQuestionIds: data.solvedQuestionIds || [],
      questionTimes: data.questionTimes || [],
      totalSolveTimeMs: data.totalSolveTimeMs || 0,
      dailyChallenge: data.dailyChallenge || null,
      streak: data.streak || 0,
      lastChallengeDate: data.lastChallengeDate || null,
      clausesMastered: data.clausesMastered || [],
    };
  }

  static async saveUserName(name) {
    const data = JSON.parse(localStorage.getItem('sqlmaster_progress') || '{}');
    data.userName = name;
    localStorage.setItem('sqlmaster_progress', JSON.stringify(data));
  }

  static async saveTopic(topicId) {
    const progress = await this.getProgress();
    if (!progress.topicsCompleted.includes(topicId)) {
      progress.topicsCompleted.push(topicId);
      await this._save(progress);
    }
  }

  static async saveQuestion(questionId, correct, timeMs) {
    if (String(questionId).startsWith('ch_')) return;
    const progress = await this.getProgress();
    
    // Check if this question was already solved successfully in the past
    const wasAlreadySolved = progress.solvedQuestionIds.includes(questionId);
    if (wasAlreadySolved) {
      // Once solved, it is finally solved. Second-time count is not considered.
      return;
    }

    progress.questionsAttempted = (progress.questionsAttempted || 0) + 1;
    if (timeMs && timeMs > 0) {
      progress.questionTimes.push({ id: questionId, time: timeMs, correct, date: new Date().toISOString() });
      if (correct) {
        progress.totalSolveTimeMs = (progress.totalSolveTimeMs || 0) + timeMs;
      }
    }
    if (correct) {
      progress.questionsSolved = (progress.questionsSolved || 0) + 1;
      progress.solvedQuestionIds.push(questionId);
    }
    await this._save(progress);
  }

  static async saveClauseMastered(clauseName) {
    const progress = await this.getProgress();
    if (!progress.clausesMastered.includes(clauseName)) {
      progress.clausesMastered.push(clauseName);
      await this._save(progress);
    }
  }

  static getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  static async getDailyChallenge(allQuestions) {
    const progress = await this.getProgress();
    const today = this.getTodayStr();
    if (progress.dailyChallenge && progress.dailyChallenge.date === today) {
      return progress.dailyChallenge;
    }
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const easy = shuffled.find(q => q.difficulty === 'easy');
    const medium = shuffled.find(q => q.difficulty === 'medium');
    const hard = shuffled.find(q => q.difficulty === 'hard');
    const picked = [easy, medium, hard].filter(Boolean);
    while (picked.length < 3 && shuffled.length > picked.length) {
      const q = shuffled.find(sq => !picked.includes(sq));
      if (q) picked.push(q); else break;
    }
    const challenge = {
      date: today,
      questions: picked.map(q => ({ id: q.id, difficulty: q.difficulty, solved: false })),
      completed: false,
      startTime: Date.now()
    };
    if (progress.lastChallengeDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
      if (progress.lastChallengeDate !== yStr && progress.lastChallengeDate !== today) {
        progress.streak = 0;
      }
    }
    progress.dailyChallenge = challenge;
    await this._save(progress);
    return challenge;
  }

  static async solveDailyChallengeQuestion(questionId) {
    const progress = await this.getProgress();
    if (!progress.dailyChallenge) return;
    const qEntry = progress.dailyChallenge.questions.find(q => q.id === questionId);
    if (qEntry) qEntry.solved = true;
    const allSolved = progress.dailyChallenge.questions.every(q => q.solved);
    if (allSolved && !progress.dailyChallenge.completed) {
      progress.dailyChallenge.completed = true;
      progress.dailyChallenge.completedTime = Date.now();
      progress.streak = (progress.streak || 0) + 1;
      progress.lastChallengeDate = this.getTodayStr();
    }
    await this._save(progress);
    return progress.dailyChallenge;
  }

  static getSpeedStats(progress) {
    const times = progress.questionTimes || [];
    const correctTimes = times.filter(t => t.correct);
    if (correctTimes.length === 0) return { avg: 0, fastest: 0, total: 0, count: 0 };
    const totalMs = correctTimes.reduce((sum, t) => sum + t.time, 0);
    const fastest = Math.min(...correctTimes.map(t => t.time));
    return { avg: Math.round(totalMs / correctTimes.length), fastest: Math.round(fastest), total: Math.round(totalMs), count: correctTimes.length };
  }

  static getActivityData(progress) {
    const times = progress.questionTimes || [];
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const count = times.filter(t => t.date && t.date.startsWith(dateStr) && t.correct).length;
      last7Days.push({ date: dateStr, label: dayLabel, count });
    }
    return last7Days;
  }

  static renderActivityChart(containerId, progress, heightPixels = 200) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const data = this.getActivityData(progress);
    const maxCount = Math.max(...data.map(d => d.count), 5);
    let html = `<div class="activity-chart" style="height:${heightPixels}px;">`;
    data.forEach((d, i) => {
      const height = (d.count / maxCount) * 100;
      const isToday = i === 6;
      html += `
        <div class="activity-bar-group">
          <div class="activity-bar-value" style="opacity:${d.count > 0 ? 1 : 0}">${d.count}</div>
          <div class="activity-bar ${isToday ? 'today' : ''}" title="${d.count} solved" style="height:${height}%;min-height:${d.count > 0 ? '4px' : '0'}">
            ${isToday ? '<span class="today-marker"></span>' : ''}
          </div>
          <div class="activity-day">${d.label}</div>
        </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
    setTimeout(() => {
      container.querySelectorAll('.activity-bar').forEach(bar => {
        const h = bar.style.height; bar.style.height = '0';
        setTimeout(() => bar.style.height = h, 50);
      });
    }, 100);
  }

  static formatTime(ms) {
    if (ms === 0) return '--';
    if (ms < 1000) return ms + 'ms';
    const secs = (ms / 1000).toFixed(1);
    if (secs < 60) return secs + 's';
    const mins = Math.floor(ms / 60000);
    const remSecs = Math.round((ms % 60000) / 1000);
    return `${mins}m ${remSecs}s`;
  }

  static async resetProgress() {
    const p = await this.getProgress();
    const emptyProgress = {
      userName: p.userName || '',
      topicsCompleted: [], questionsSolved: 0, questionsAttempted: 0, solvedQuestionIds: [],
      questionTimes: [], totalSolveTimeMs: 0, dailyChallenge: null, streak: 0,
      lastChallengeDate: null, clausesMastered: []
    };
    await this._save(emptyProgress);
  }

  static async _save(progress) {
    localStorage.setItem('sqlmaster_progress', JSON.stringify(progress));
  }
}
