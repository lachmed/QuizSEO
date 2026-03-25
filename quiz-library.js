/**
 * Community quiz library — same API as main Vue app: GET /api/quiz-library
 * Configure via <meta name="quiz-api-base"> and <meta name="quiz-app-base">
 */
(function () {
  const MESSAGES = {
    en: {
      title: "Community quiz library",
      subtitle:
        "Browse quizzes created by guests. Open any quiz to try it or share the link.",
      questions: "Questions",
      choices: "Choices",
      difficulty: "Difficulty",
      quizType: "Quiz type",
      openQuiz: "Open quiz",
      loadMore: "Load more",
      loading: "Loading...",
      empty:
        "No guest quizzes yet. Generate one from the app without signing in.",
      errorTitle: "Something went wrong.",
      quizFallback: "Quiz",
      genericError: "Please try again later.",
    },
    ar: {
      title: "مكتبة اختبارات المجتمع",
      subtitle:
        "تصفح الاختبارات التي أنشأها الزوار. افتح أي اختبار لتجربته أو مشاركته.",
      questions: "الأسئلة",
      choices: "الخيارات",
      difficulty: "الصعوبة",
      quizType: "نوع الاختبار",
      openQuiz: "فتح الاختبار",
      loadMore: "تحميل المزيد",
      loading: "جاري التحميل...",
      empty:
        "لا توجد اختبارات بعد. أنشئ واحداً من التطبيق دون تسجيل الدخول.",
      errorTitle: "حدث خطأ.",
      quizFallback: "اختبار",
      genericError: "يرجى المحاولة لاحقاً.",
    },
  };

  function metaContent(name, fallback) {
    const el = document.querySelector(`meta[name="${name}"]`);
    const v = el && el.getAttribute("content");
    return (v && v.trim()) || fallback;
  }

  function getLang() {
    const lang = (document.documentElement.getAttribute("lang") || "en")
      .toLowerCase()
      .slice(0, 2);
    return lang === "ar" ? "ar" : "en";
  }

  const lang = getLang();
  const MSG = MESSAGES[lang];
  const API_BASE = metaContent(
    "quiz-api-base",
    "https://quizgenerator-r4pa.onrender.com",
  ).replace(/\/$/, "");
  const APP_BASE = metaContent(
    "quiz-app-base",
    "https://quizgenerator-r4pa.onrender.com",
  ).replace(/\/$/, "");

  const mount = document.getElementById("quiz-library-root");
  if (!mount) return;

  const pageSize = 24;
  let total = 0;
  let quizzes = [];
  let loading = false;
  let jsonLdEl = null;
  let appendError = "";

  function t(key) {
    return MSG[key] || key;
  }

  function quizOpenUrl(id) {
    return `${APP_BASE}/new-quiz/${encodeURIComponent(id)}`;
  }

  function nbQuestions(q) {
    const n = q && q["number of questions"];
    return typeof n === "number" ? String(n) : "—";
  }

  function nbChoices(q) {
    const n = q && q["number of choices"];
    if (n === "" || n === undefined || n === null) return "—";
    return String(n);
  }

  function cardSubtitle(item) {
    const name =
      typeof item.guestName === "string" ? item.guestName.trim() : "";
    if (name) return name;
    const sub = item.quizData && item.quizData.subject;
    return typeof sub === "string" ? sub.trim() : "";
  }

  function removeJsonLd() {
    if (jsonLdEl && jsonLdEl.parentNode) {
      jsonLdEl.parentNode.removeChild(jsonLdEl);
      jsonLdEl = null;
    }
  }

  function setJsonLd(items) {
    removeJsonLd();
    const list = items.map(function (q, i) {
      const d = q.quizData || {};
      return {
        "@type": "ListItem",
        position: i + 1,
        url: quizOpenUrl(q._id),
        name: d.Title || t("quizFallback"),
      };
    });
    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: t("title"),
      description: t("subtitle"),
      numberOfItems: items.length,
      itemListElement: list,
    };
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.setAttribute("data-quiz-library-seo", "1");
    s.textContent = JSON.stringify(schema);
    document.head.appendChild(s);
    jsonLdEl = s;
  }

  function escapeHtml(s) {
    if (s == null) return "";
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function renderCard(item) {
    const d = item.quizData || {};
    const title = d.Title || t("quizFallback");
    const sub = cardSubtitle(item);
    const diff = d.difficulty || "—";
    const qType = d.quizType || "—";
    const id = item._id;

    const subBlock = sub
      ? `<p class="quiz-lib-card-meta" itemprop="author">${escapeHtml(sub)}</p>`
      : "";

    return (
      `<li>` +
      `<article class="quiz-lib-card" itemscope itemtype="https://schema.org/LearningResource">` +
      `<h3 class="quiz-lib-card-title" itemprop="name">${escapeHtml(title)}</h3>` +
      subBlock +
      `<dl class="quiz-lib-stats">` +
      `<div><dt>${escapeHtml(t("questions"))}</dt><dd>${escapeHtml(nbQuestions(d))}</dd></div>` +
      `<div><dt>${escapeHtml(t("choices"))}</dt><dd>${escapeHtml(nbChoices(d))}</dd></div>` +
      `<div><dt>${escapeHtml(t("difficulty"))}</dt><dd>${escapeHtml(String(diff))}</dd></div>` +
      `<div><dt>${escapeHtml(t("quizType"))}</dt><dd>${escapeHtml(String(qType))}</dd></div>` +
      `</dl>` +
      `<a class="quiz-lib-btn" href="${escapeHtml(quizOpenUrl(id))}" itemprop="url">${escapeHtml(t("openQuiz"))}</a>` +
      `</article>` +
      `</li>`
    );
  }

  function render() {
    const hasMore = quizzes.length < total;
    let body = "";

    if (loading && quizzes.length === 0) {
      body = `<p class="quiz-lib-loading" role="status">${escapeHtml(t("loading"))}</p>`;
    } else if (errorState) {
      body =
        `<div class="quiz-lib-error" role="alert">` +
        `<strong>${escapeHtml(t("errorTitle"))}</strong>` +
        `<span>${escapeHtml(errorDetail || t("genericError"))}</span>` +
        `</div>`;
    } else if (!loading && quizzes.length === 0) {
      body = `<p class="quiz-lib-empty">${escapeHtml(t("empty"))}</p>`;
    } else {
      body =
        `<ul class="quiz-lib-grid">` +
        quizzes.map(renderCard).join("") +
        `</ul>`;
      if (appendError) {
        body +=
          `<div class="quiz-lib-error quiz-lib-append-error" role="alert">` +
          `<span>${escapeHtml(appendError)}</span>` +
          `</div>`;
      }
      if (loading) {
        body += `<p class="quiz-lib-loading" role="status">${escapeHtml(t("loading"))}</p>`;
      }
      if (hasMore && !loading) {
        body +=
          `<div class="quiz-lib-load-more">` +
          `<button type="button" id="quiz-lib-load-more-btn">${escapeHtml(t("loadMore"))}</button>` +
          `</div>`;
      } else if (hasMore && loading) {
        body +=
          `<div class="quiz-lib-load-more">` +
          `<button type="button" disabled>${escapeHtml(t("loading"))}</button>` +
          `</div>`;
      }
    }

    mount.innerHTML =
      `<div class="quiz-lib-inner">` +
      `<header class="quiz-lib-header">` +
      `<h2 class="quiz-lib-title">${escapeHtml(t("title"))}</h2>` +
      `<p class="quiz-lib-subtitle">${escapeHtml(t("subtitle"))}</p>` +
      `</header>` +
      `<div class="quiz-lib-body">${body}</div>` +
      `</div>`;

    const btn = document.getElementById("quiz-lib-load-more-btn");
    if (btn) {
      btn.addEventListener("click", function () {
        fetchPage(true);
      });
    }
  }

  let errorState = false;
  let errorDetail = "";

  async function fetchPage(append) {
    loading = true;
    appendError = "";
    if (!append) {
      errorState = false;
      errorDetail = "";
      quizzes = [];
    }
    render();

    const skipParam = append ? quizzes.length : 0;
    const url =
      API_BASE +
      "/api/quiz-library?limit=" +
      pageSize +
      "&skip=" +
      skipParam;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(function () {
        return null;
      });

      if (!data || data.status === false) {
        const msg =
          (data && typeof data.message === "string" && data.message) ||
          (!res.ok ? "HTTP " + res.status : "") ||
          t("genericError");
        if (append && quizzes.length > 0) {
          appendError = msg;
        } else {
          errorState = true;
          errorDetail = msg;
        }
        loading = false;
        render();
        return;
      }

      total = typeof data.total === "number" ? data.total : 0;
      const batch = Array.isArray(data.quizzes) ? data.quizzes : [];
      if (append) {
        quizzes = quizzes.concat(batch);
      } else {
        quizzes = batch;
      }
      setJsonLd(quizzes);
    } catch (e) {
      const msg = e && e.message ? String(e.message) : t("genericError");
      if (append && quizzes.length > 0) {
        appendError = msg;
      } else {
        errorState = true;
        errorDetail = msg;
      }
    } finally {
      loading = false;
      render();
    }
  }

  window.addEventListener("beforeunload", removeJsonLd);
  fetchPage(false);
})();
