document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  let debounceTimer;

  // 防抖函数
  function debounce(func, delay) {
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        func.apply(context, args);
      }, delay);
    };
  }

  // 搜索函数
  async function performSearch(keyword) {
    if (!keyword.trim()) {
      searchResults.style.display = 'none';
      return;
    }

    try {
      const response = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}`);
      if (!response.ok) {
        throw new Error('搜索请求失败');
      }

      const data = await response.json();
      displayResults(data);
    } catch (error) {
      console.error('搜索出错:', error);
    }
  }

  // 显示搜索结果
  function displayResults(results) {
    if (!results || results.length === 0) {
      searchResults.style.display = 'none';
      return;
    }

    searchResults.innerHTML = '';
    results.forEach(result => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.textContent = result.name;
      item.addEventListener('click', () => {
        // 这里可以添加点击后的处理逻辑，比如跳转到详情页
        console.log('选中:', result.name);
        window.location.href = `/player?name=${encodeURIComponent(result.name)}`;
      });
      searchResults.appendChild(item);
    });
    searchResults.style.display = 'block';
  }

  // 监听输入框输入事件
  searchInput.addEventListener('input', debounce(function (e) {
    performSearch(e.target.value);
  }, 300)); // 300ms 的防抖延迟

  // 点击其他地方时隐藏搜索结果
  document.addEventListener('click', function (e) {
    if (!searchResults.contains(e.target) && e.target !== searchInput) {
      searchResults.style.display = 'none';
    }
  });

  // 监听输入框聚焦事件
  searchInput.addEventListener('focus', function () {
    if (this.value.trim() && searchResults.children.length > 0) {
      searchResults.style.display = 'block';
    }
  });
});
