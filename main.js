document.addEventListener('DOMContentLoaded', () => {
  /* ========================================
     1. 내비게이션 스크롤 효과
  ======================================== */

  const navbar = document.getElementById('navbar');

  function updateNavbar() {
    if (!navbar) return;

    navbar.classList.toggle(
      'scrolled',
      window.scrollY > 50
    );
  }

  updateNavbar();

  window.addEventListener('scroll', updateNavbar, {
    passive: true
  });

  /* ========================================
     2. 이미지 오류 처리
     외부의 임의 이미지로 대체하지 않음
  ======================================== */

  document
    .querySelectorAll('.work-thumb img')
    .forEach((image) => {
      function showMissingState() {
        image.hidden = true;

        if (image.parentElement) {
          image.parentElement.classList.add(
            'asset-missing'
          );
        }
      }

      if (
        image.complete &&
        image.naturalWidth === 0
      ) {
        showMissingState();
      } else {
        image.addEventListener(
          'error',
          showMissingState,
          {
            once: true
          }
        );
      }
    });

  /* ========================================
     3. 현재 섹션 내비게이션 표시
  ======================================== */

  const navLinks = Array.from(
    document.querySelectorAll('.nav-links a')
  );

  const observedSections = navLinks
    .map((link) => {
      const selector = link.getAttribute('href');

      if (
        !selector ||
        !selector.startsWith('#')
      ) {
        return null;
      }

      return document.querySelector(selector);
    })
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    const sectionObserver =
      new IntersectionObserver(
        (entries) => {
          const visibleSection = entries
            .filter(
              (entry) => entry.isIntersecting
            )
            .sort(
              (a, b) =>
                b.intersectionRatio -
                a.intersectionRatio
            )[0];

          if (!visibleSection) return;

          navLinks.forEach((link) => {
            const targetSection =
              link.getAttribute('href') ===
              `#${visibleSection.target.id}`;

            link.classList.toggle(
              'active',
              targetSection
            );
          });
        },
        {
          rootMargin: '-25% 0px -60% 0px',
          threshold: [0, 0.2, 0.5]
        }
      );

    observedSections.forEach((section) => {
      sectionObserver.observe(section);
    });
  }

  /* ========================================
     4. 작품 필터 및 더보기
     PC 기준 처음 6개 노출
  ======================================== */

  const INITIAL_LIMIT = 6;
  const LOAD_STEP = 99;

  let currentVisibleCount = INITIAL_LIMIT;
  let activeFilter = 'all';

  const filterButtons =
    document.querySelectorAll('.filter-btn');

  const allCards = Array.from(
    document.querySelectorAll('.work-card')
  );

  const loadMoreBtn =
    document.getElementById('load-more-btn');

  function updateCardVisibility() {
    const matchedCards = allCards.filter(
      (card) => {
        const category =
          card.getAttribute('data-category');

        return (
          activeFilter === 'all' ||
          category === activeFilter
        );
      }
    );

    allCards.forEach((card) => {
      const shouldShow =
        matchedCards.includes(card);

      if (!shouldShow) {
        card.classList.add('is-hidden');
      }
    });

    matchedCards.forEach((card, index) => {
      const shouldShow =
        index < currentVisibleCount;

      card.classList.toggle(
        'is-hidden',
        !shouldShow
      );
    });

    if (!loadMoreBtn) return;

    if (matchedCards.length <= INITIAL_LIMIT) {
      loadMoreBtn.style.display = 'none';

      loadMoreBtn.setAttribute(
        'data-state',
        'hidden'
      );

      return;
    }

    loadMoreBtn.style.display = 'inline-flex';

    if (
      currentVisibleCount >=
      matchedCards.length
    ) {
      loadMoreBtn.innerHTML = `
        접기
        <i
          class="fa-solid fa-chevron-up"
          aria-hidden="true"
        ></i>
      `;

      loadMoreBtn.setAttribute(
        'data-state',
        'collapse'
      );

      loadMoreBtn.setAttribute(
        'aria-label',
        '작품 목록 접기'
      );
    } else {
      loadMoreBtn.innerHTML = `
        더보기
        <i
          class="fa-solid fa-chevron-down"
          aria-hidden="true"
        ></i>
      `;

      loadMoreBtn.setAttribute(
        'data-state',
        'expand'
      );

      loadMoreBtn.setAttribute(
        'aria-label',
        '작품 더보기'
      );
    }
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener(
      'click',
      () => {
        const state =
          loadMoreBtn.getAttribute(
            'data-state'
          );

        if (state === 'collapse') {
          currentVisibleCount =
            INITIAL_LIMIT;

          updateCardVisibility();

          const worksSection =
            document.getElementById('works');

          if (worksSection) {
            const navOffset = 80;

            const targetY =
              worksSection
                .getBoundingClientRect()
                .top +
              window.scrollY -
              navOffset;

            window.scrollTo({
              top: targetY,
              behavior: 'smooth'
            });
          }
        } else if (state === 'expand') {
          currentVisibleCount += LOAD_STEP;

          updateCardVisibility();
        }
      }
    );
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((item) => {
        item.classList.remove('active');

        item.setAttribute(
          'aria-pressed',
          'false'
        );
      });

      button.classList.add('active');

      button.setAttribute(
        'aria-pressed',
        'true'
      );

      activeFilter =
        button.getAttribute('data-filter') ||
        'all';

      currentVisibleCount = INITIAL_LIMIT;

      updateCardVisibility();
    });
  });

  updateCardVisibility();

  /* ========================================
     5. 영상·이미지·웹사이트 모달
  ======================================== */

  const modal =
    document.getElementById('mediaModal');

  const modalBody =
    document.getElementById('modalBody');

  const modalCloseBtn =
    document.getElementById(
      'modalCloseBtn'
    );

  const prevBtn =
    document.getElementById(
      'modalPrevBtn'
    );

  const nextBtn =
    document.getElementById(
      'modalNextBtn'
    );

  const modalCounter =
    document.getElementById(
      'modalCounter'
    );

  let currentGalleryItems = [];
  let currentIndex = 0;
  let currentMediaType = '';
  let lastFocusedElement = null;

  function updateSlide() {
    if (
      !modalBody ||
      currentGalleryItems.length === 0
    ) {
      return;
    }

    const currentItem =
      currentGalleryItems[currentIndex];

    if (
      currentMediaType ===
      'video-gallery'
    ) {
      modalBody.innerHTML = `
        <video
          controls
          autoplay
          playsinline
          style="width: 100%; height: 100%;"
        >
          <source
            src="${currentItem}"
            type="video/mp4"
          >
          브라우저가 비디오 재생을 지원하지 않습니다.
        </video>
      `;
    } else {
      modalBody.innerHTML = `
        <img
          src="${currentItem}"
          class="gallery-img"
          alt="상세 이미지 ${
            currentIndex + 1
          }"
        >
      `;
    }

    if (modalCounter) {
      modalCounter.textContent = `${
        currentIndex + 1
      } / ${currentGalleryItems.length}`;
    }
  }

  function openMediaModal(type, src) {
    if (
      !modal ||
      !modalBody ||
      !src
    ) {
      return;
    }

    lastFocusedElement =
      document.activeElement;

    modalBody.innerHTML = '';
    modalBody.scrollTop = 0;

    modalBody.classList.toggle(
      'image-scroll-mode',
      type === 'image'
    );

    if (prevBtn) {
      prevBtn.style.display = 'none';
    }

    if (nextBtn) {
      nextBtn.style.display = 'none';
    }

    if (modalCounter) {
      modalCounter.style.display = 'none';
    }

    currentMediaType = type;
    currentGalleryItems = [];
    currentIndex = 0;

    if (type === 'video') {
      modalBody.innerHTML = `
        <video
          controls
          autoplay
          playsinline
          style="width: 100%; height: 100%;"
        >
          <source
            src="${src}"
            type="video/mp4"
          >
          브라우저가 비디오 재생을 지원하지 않습니다.
        </video>
      `;
    } else if (type === 'iframe') {
      modalBody.innerHTML = `
        <iframe
          src="${src}"
          title="웹사이트 미리보기"
          allowfullscreen
        ></iframe>
      `;
    } else if (type === 'image') {
      modalBody.innerHTML = `
        <img
          src="${src}"
          class="gallery-img project-scroll-image"
          alt="웹디자인 전체 이미지"
        >
      `;
    } else if (
      type === 'gallery' ||
      type === 'video-gallery'
    ) {
      currentGalleryItems = src
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      if (
        currentGalleryItems.length === 0
      ) {
        modalBody.classList.remove(
          'image-scroll-mode'
        );

        return;
      }

      const hasMultipleItems =
        currentGalleryItems.length > 1;

      if (prevBtn) {
        prevBtn.style.display =
          hasMultipleItems
            ? 'flex'
            : 'none';
      }

      if (nextBtn) {
        nextBtn.style.display =
          hasMultipleItems
            ? 'flex'
            : 'none';
      }

      if (modalCounter) {
        modalCounter.style.display =
          'block';
      }

      updateSlide();
    } else {
      modalBody.classList.remove(
        'image-scroll-mode'
      );

      return;
    }

    modal.classList.add('active');

    modal.setAttribute(
      'aria-hidden',
      'false'
    );

    document.body.style.overflow =
      'hidden';

    if (modalCloseBtn) {
      modalCloseBtn.focus();
    }
  }

  function closeMediaModal() {
    if (!modal || !modalBody) {
      return;
    }

    modal.classList.remove('active');

    modal.setAttribute(
      'aria-hidden',
      'true'
    );

    modalBody.innerHTML = '';
    modalBody.scrollTop = 0;

    modalBody.classList.remove(
      'image-scroll-mode'
    );

    document.body.style.overflow = '';

    currentGalleryItems = [];
    currentIndex = 0;
    currentMediaType = '';

    if (
      lastFocusedElement &&
      typeof lastFocusedElement.focus ===
        'function'
    ) {
      lastFocusedElement.focus();
    }
  }

  function showNextSlide() {
    if (
      currentGalleryItems.length === 0
    ) {
      return;
    }

    currentIndex =
      (currentIndex + 1) %
      currentGalleryItems.length;

    updateSlide();
  }

  function showPreviousSlide() {
    if (
      currentGalleryItems.length === 0
    ) {
      return;
    }

    currentIndex =
      (
        currentIndex -
        1 +
        currentGalleryItems.length
      ) % currentGalleryItems.length;

    updateSlide();
  }

  if (nextBtn) {
    nextBtn.addEventListener(
      'click',
      (event) => {
        event.stopPropagation();
        showNextSlide();
      }
    );
  }

  if (prevBtn) {
    prevBtn.addEventListener(
      'click',
      (event) => {
        event.stopPropagation();
        showPreviousSlide();
      }
    );
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener(
      'click',
      closeMediaModal
    );
  }

  if (modal) {
    modal.setAttribute(
      'aria-hidden',
      'true'
    );

    modal.addEventListener(
      'click',
      (event) => {
        if (event.target === modal) {
          closeMediaModal();
        }
      }
    );
  }

  window.addEventListener(
    'keydown',
    (event) => {
      if (
        !modal ||
        !modal.classList.contains(
          'active'
        )
      ) {
        return;
      }

      if (event.key === 'Escape') {
        closeMediaModal();
        return;
      }

      if (
        event.key === 'ArrowRight' &&
        currentGalleryItems.length > 1
      ) {
        showNextSlide();
      }

      if (
        event.key === 'ArrowLeft' &&
        currentGalleryItems.length > 1
      ) {
        showPreviousSlide();
      }
    }
  );

  document
    .querySelectorAll(
      '.open-modal-btn, .btn-play-trigger'
    )
    .forEach((button) => {
      button.addEventListener(
        'click',
        (event) => {
          /*
           * 프로젝트 이미지 갤러리 버튼은
           * 아래 전용 기능에서 따로 처리합니다.
           */
          if (
            event.currentTarget.classList.contains(
              'open-project-gallery'
            )
          ) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          const targetButton =
            event.currentTarget;

          const type =
            targetButton.getAttribute(
              'data-type'
            );

          let src = '';

          if (type === 'video') {
            src =
              targetButton.getAttribute(
                'data-video-src'
              ) || '';
          }

          if (type === 'iframe') {
            src =
              targetButton.getAttribute(
                'data-web-url'
              ) || '';
          }

          if (type === 'image') {
            src =
              targetButton.getAttribute(
                'data-img-src'
              ) || '';
          }

          if (type === 'gallery') {
            src =
              targetButton.getAttribute(
                'data-images'
              ) || '';
          }

          if (
            type === 'video-gallery'
          ) {
            src =
              targetButton.getAttribute(
                'data-videos'
              ) || '';
          }

          if (src) {
            openMediaModal(
              type,
              src.trim()
            );
          }
        }
      );
    });

  /* ========================================
     6. 스킬 정보
  ======================================== */

  const skillData = {
    video: {
      number: '01',
      label: 'VIDEO & MOTION',
      title: 'Video & Motion',

      intro:
        '영상의 흐름과 목적에 맞춰 컷을 구성하여 편집하고,\n그래픽에 움직임을 주어 시각적인 효과를 제작할 수 있습니다.',

      skills: [
        '영상 기획 및 스토리보드 구성',
        '컷 편집과 장면 전환을 활용한 흐름 구성',
        '자막·모션 그래픽 및 시각 효과 제작',
        '브랜드 광고·홍보 영상과 숏폼 콘텐츠 제작',
        '색 보정·사운드 편집 및 최종 영상 출력'
      ],

      tools: [
        'Premiere Pro',
        'After Effects',
        'Media Encoder'
      ]
    },

    graphic: {
      number: '02',
      label: 'GRAPHIC DESIGN',
      title: 'Graphic Design',

      intro:
        '아이디어를 보기 좋은 이미지로 구체화하고,\n콘텐츠의 목적에 맞는 디자인을 제작할 수 있습니다.',

      skills: [
        '브랜드 콘셉트 및 시각 디자인 구성',
        '포스터·리플렛 등 홍보물 디자인',
        'SNS 카드뉴스와 콘텐츠 이미지 제작',
        '로고·패키지·목업 디자인 제작',
        '이미지 보정·합성 및 인쇄물 편집'
      ],

      tools: [
        'Photoshop',
        'Illustrator',
        'Figma'
      ]
    },

    web: {
      number: '03',
      label: 'WEB & CODE',
      title: 'Web & Code',

      intro:
        'HTML, CSS, JavaScript와 AI 도구를 활용해 아이디어를 웹페이지로 구현하고,\n필요한 기능을 수정할 수 있습니다.',

      skills: [
        '포트폴리오 및 소개용 웹페이지 구성',
        'HTML과 CSS를 활용한 화면 디자인 구현',
        'PC·태블릿·모바일 반응형 화면 제작',
        'JavaScript를 활용한 클릭 효과와 기능 추가',
        'AI를 활용한 웹 코드 작성 및 오류 수정'
      ],

      tools: [
        'HTML5',
        'CSS3',
        'JavaScript',
        'VS Code',
        'GitHub'
      ]
    },

    ai: {
      number: '04',
      label: 'CREATIVE AI',
      title: 'Creative AI Workflow',

      intro:
        '생성형 AI를 활용해 아이디어를 구체화하고 다양한 콘텐츠를 빠르게 제작할 수 있습니다.',

      skills: [
        '콘텐츠 아이디어 및 콘셉트 기획',
        '이미지·영상 제작용 프롬프트 작성',
        '스토리보드와 영상 시나리오 구성',
        '홍보 문구 및 콘텐츠 텍스트 작성',
        'AI를 활용한 웹페이지 제작과 코드 보완'
      ],

      tools: [
        'ChatGPT',
        'Gemini',
        'Generative AI'
      ]
    }
  };

  /* ========================================
     7. 스킬 상세 모달
  ======================================== */

  const skillModal =
    document.getElementById(
      'skillModal'
    );

  const skillModalClose =
    document.getElementById(
      'skillModalClose'
    );

  const skillModalNumber =
    document.getElementById(
      'skillModalNumber'
    );

  const skillModalLabel =
    document.getElementById(
      'skillModalLabel'
    );

  const skillModalTitle =
    document.getElementById(
      'skillModalTitle'
    );

  const skillModalIntro =
    document.getElementById(
      'skillModalIntro'
    );

  const skillModalList =
    document.getElementById(
      'skillModalList'
    );

  const skillModalTools =
    document.getElementById(
      'skillModalTools'
    );

  let lastFocusedSkillCard = null;

  function openSkillModal(skillKey) {
    const selectedSkill =
      skillData[skillKey];

    if (
      !selectedSkill ||
      !skillModal
    ) {
      return;
    }

    lastFocusedSkillCard =
      document.activeElement;

    if (skillModalNumber) {
      skillModalNumber.textContent =
        selectedSkill.number;
    }

    if (skillModalLabel) {
      skillModalLabel.textContent =
        selectedSkill.label;
    }

    if (skillModalTitle) {
      skillModalTitle.textContent =
        selectedSkill.title;
    }

    if (skillModalIntro) {
      skillModalIntro.textContent =
        selectedSkill.intro;
    }

    if (skillModalList) {
      skillModalList.innerHTML =
        selectedSkill.skills
          .map(
            (skill) =>
              `<li>${skill}</li>`
          )
          .join('');
    }

    if (skillModalTools) {
      skillModalTools.innerHTML =
        selectedSkill.tools
          .map(
            (tool) =>
              `<span class="skill-tool">${tool}</span>`
          )
          .join('');
    }

    skillModal.classList.add('active');

    skillModal.setAttribute(
      'aria-hidden',
      'false'
    );

    document.body.style.overflow =
      'hidden';

    if (skillModalClose) {
      skillModalClose.focus();
    }
  }

  function closeSkillModal() {
    if (!skillModal) {
      return;
    }

    skillModal.classList.remove('active');

    skillModal.setAttribute(
      'aria-hidden',
      'true'
    );

    document.body.style.overflow = '';

    if (
      lastFocusedSkillCard &&
      typeof lastFocusedSkillCard.focus ===
        'function'
    ) {
      lastFocusedSkillCard.focus();
    }
  }

  document
    .querySelectorAll(
      '.skill-card[data-skill]'
    )
    .forEach((card) => {
      card.addEventListener(
        'click',
        () => {
          openSkillModal(
            card.dataset.skill
          );
        }
      );

      card.addEventListener(
        'keydown',
        (event) => {
          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {
            event.preventDefault();

            openSkillModal(
              card.dataset.skill
            );
          }
        }
      );
    });

  if (skillModalClose) {
    skillModalClose.addEventListener(
      'click',
      closeSkillModal
    );
  }

  if (skillModal) {
    skillModal.setAttribute(
      'aria-hidden',
      'true'
    );

    skillModal.addEventListener(
      'click',
      (event) => {
        if (event.target === skillModal) {
          closeSkillModal();
        }
      }
    );
  }

  document.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key === 'Escape' &&
        skillModal &&
        skillModal.classList.contains(
          'active'
        )
      ) {
        closeSkillModal();
      }
    }
  );

  /* ========================================
     8. 프로젝트 이미지 갤러리
  ======================================== */

  const projectGalleryModal =
    document.getElementById(
      'projectGalleryModal'
    );

  const projectGalleryImages =
    document.getElementById(
      'projectGalleryImages'
    );

  const projectVideoLink =
    document.getElementById(
      'projectVideoLink'
    );

  const projectGalleryClose =
    document.querySelector(
      '.project-gallery-close'
    );

  const projectGalleryButtons =
    document.querySelectorAll(
      '.open-project-gallery'
    );

  let lastFocusedGalleryButton = null;

  function openProjectGallery(button) {
    if (
      !projectGalleryModal ||
      !projectGalleryImages ||
      !projectVideoLink ||
      !projectGalleryClose
    ) {
      console.error(
        '프로젝트 이미지 모달 요소를 찾을 수 없습니다.'
      );

      return;
    }

    lastFocusedGalleryButton = button;

    const imageData =
      button.getAttribute('data-images') ||
      '';

      const galleryLayout =
  button.getAttribute('data-layout') ||
  '';

    const videoUrl =
      button.getAttribute(
        'data-video-url'
      ) || '';

    const imagePaths = imageData
      .split('|')
      .map((path) => path.trim())
      .filter(Boolean);

    projectGalleryImages.innerHTML = '';

    projectGalleryImages.classList.remove(
  'grid-two'
);

    projectGalleryImages.classList.toggle(
  'grid-two',
  galleryLayout === 'grid-two'
);

    imagePaths.forEach(
      (imagePath, index) => {
        const image =
          document.createElement('img');

        image.src = imagePath;

        image.alt =
          `프로젝트 설명 이미지 ${
            index + 1
          }`;

        image.loading =
          index === 0 ? 'eager' : 'lazy';

        projectGalleryImages.appendChild(
          image
        );
      }
    );

    if (videoUrl) {
      projectVideoLink.href = videoUrl;
      projectVideoLink.hidden = false;

      projectVideoLink.style.display =
        'inline-flex';
    } else {
      projectVideoLink.removeAttribute(
        'href'
      );

      projectVideoLink.hidden = true;

      projectVideoLink.style.display =
        'none';
    }

    projectGalleryModal.classList.add(
      'is-open'
    );

    projectGalleryModal.setAttribute(
      'aria-hidden',
      'false'
    );

    document.body.classList.add(
      'modal-open'
    );

    const galleryContent =
      projectGalleryModal.querySelector(
        '.project-gallery-content'
      );

    if (galleryContent) {
      galleryContent.scrollTop = 0;
    }

    projectGalleryClose.focus();
  }

  function closeProjectGallery() {
    if (
      !projectGalleryModal ||
      !projectGalleryImages
    ) {
      return;
    }

    projectGalleryModal.classList.remove(
      'is-open'
    );

    projectGalleryModal.setAttribute(
      'aria-hidden',
      'true'
    );

    document.body.classList.remove(
      'modal-open'
    );

    projectGalleryImages.innerHTML = '';

    if (
      lastFocusedGalleryButton &&
      typeof lastFocusedGalleryButton.focus ===
        'function'
    ) {
      lastFocusedGalleryButton.focus();
    }
  }

  projectGalleryButtons.forEach(
    (button) => {
      button.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
          event.stopPropagation();

          openProjectGallery(button);
        }
      );
    }
  );

  if (projectGalleryClose) {
    projectGalleryClose.addEventListener(
      'click',
      closeProjectGallery
    );
  }

  if (projectGalleryModal) {
    projectGalleryModal.setAttribute(
      'aria-hidden',
      'true'
    );

    projectGalleryModal.addEventListener(
      'click',
      (event) => {
        if (
          event.target ===
          projectGalleryModal
        ) {
          closeProjectGallery();
        }
      }
    );
  }

  document.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key === 'Escape' &&
        projectGalleryModal &&
        projectGalleryModal.classList.contains(
          'is-open'
        )
      ) {
        closeProjectGallery();
      }
    }
  );
});