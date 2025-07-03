// src/directives/mathjax.js
function waitForMathJax(callback) {
  if (window.MathJax && window.MathJax.typesetPromise) {
    callback();
  } else {
    setTimeout(() => waitForMathJax(callback), 50); // 每50ms检查一次
  }
}

export default {
  mounted(el) {
    waitForMathJax(() => {
      window.MathJax.typesetPromise([el]);
    });
  },
  updated(el) {
    waitForMathJax(() => {
      window.MathJax.typesetClear([el]);
      window.MathJax.typesetPromise([el]);
    });
  }
};
