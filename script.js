document.addEventListener("DOMContentLoaded", initializeSearch);

function initializeSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchCounter = document.getElementById("searchCounter");
  const notification = document.getElementById("searchNotification");

  let currentHighlightIndex = 0;
  let highlights = [];

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function removeHighlights() {
    document
      .querySelectorAll(".highlight, .current-highlight")
      .forEach((el) => {
        let text = el.textContent;
        let parent = el.parentNode;
        let textNode = document.createTextNode(text);
        parent.replaceChild(textNode, el);
      });
    document.querySelector(".container").normalize();
  }

  function highlightText(searchText) {
    if (!searchText.trim()) {
      searchCounter.textContent = "0/0";
      searchCounter.classList.remove("active");
      removeHighlights();
      return;
    }
    removeHighlights();

    const contentAreas = document.querySelectorAll(".content, .sidebar");
    highlights = [];

    contentAreas.forEach((area) => {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = area.innerHTML;

      const textNodes = [];
      const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) =>
          node.textContent.trim()
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
      });

      let currentNode;
      while ((currentNode = walker.nextNode())) {
        textNodes.push(currentNode);
      }

      const escapedSearchText = escapeRegExp(searchText.trim());
      textNodes.forEach((textNode) => {
        const parent = textNode.parentNode;
        const text = textNode.textContent;
        const regex = new RegExp(`(${escapedSearchText})`, "gi");

        if (!regex.test(text)) return;
        regex.lastIndex = 0;

        const frag = document.createDocumentFragment();
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
          if (match.index > lastIndex) {
            frag.appendChild(
              document.createTextNode(text.substring(lastIndex, match.index))
            );
          }
          const span = document.createElement("span");
          span.className = "highlight";
          span.textContent = match[0];
          frag.appendChild(span);
          highlights.push(span);
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < text.length) {
          frag.appendChild(document.createTextNode(text.substring(lastIndex)));
        }
        parent.replaceChild(frag, textNode);
      });

      area.innerHTML = tempDiv.innerHTML;
    });

    highlights = Array.from(document.querySelectorAll(".highlight"));

    if (highlights.length > 0) {
      currentHighlightIndex = 0;
      searchCounter.classList.add("active");
      updateHighlightState();
      notification.style.opacity = "0";
    } else {
      searchCounter.textContent = "0/0";
      searchCounter.classList.remove("active");
      notification.textContent = `No results found for "${searchText}"`;
      notification.style.opacity = "1";
      setTimeout(() => (notification.style.opacity = "0"), 2000);
    }
  }

  function updateHighlightState() {
    if (highlights.length === 0) return;
    highlights.forEach((highlight, index) => {
      highlight.className =
        index === currentHighlightIndex ? "current-highlight" : "highlight";
      if (index === currentHighlightIndex) {
        highlight.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
    searchCounter.textContent = `${currentHighlightIndex + 1}/${
      highlights.length
    }`;
  }

  let debounceTimeout;
  
  const newSearchInput = searchInput.cloneNode(true);
  searchInput.parentNode.replaceChild(newSearchInput, searchInput);
  
  newSearchInput.addEventListener("input", function () {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      highlightText(this.value);
    }, 300);
  });

  newSearchInput.addEventListener("focus", function () {
    if (this.value.trim() !== "" && highlights.length > 0) {
      searchCounter.classList.add("active");
    }
  });

  newSearchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && highlights.length > 0) {
      e.preventDefault();
      currentHighlightIndex = (currentHighlightIndex + 1) % highlights.length;
      updateHighlightState();
    }
  });
}

document.addEventListener('click', function(e) {
  if (e.target.tagName === 'A' && e.target.getAttribute('href')) {
    setTimeout(initializeSearch, 300);
  }
});
