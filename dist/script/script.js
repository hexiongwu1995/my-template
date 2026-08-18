

        const hiddenContent = document.querySelector('.hidden-content');
        const article = document.querySelector('article');
        article.innerHTML = hiddenContent.innerHTML;



        const aside = document.querySelector('aside');
        function isLargeScreen() {
            const isLarge = window.innerWidth >= 900;
            if (isLarge) {
                aside.classList.add('visible');
            } else {
                aside.classList.remove('visible');
            }
        }
        isLargeScreen();



        const main = document.querySelector('main');
        const pagetitle = document.querySelector('.pagetitle');
        const collection = document.querySelector('.collection');
        function mainWidth() {
            if (main.offsetWidth <= 200) {
                pagetitle.style.display = 'none';
                collection.style.display = 'none';
            } else {
                pagetitle.style.display = '';
                collection.style.display = '';
            }
        }
        mainWidth();



        const toggleBar = document.querySelector('.icon-bars');
        const overlay = document.querySelector('.overlay');

        toggleBar.addEventListener('click', () => {
            aside.classList.toggle('visible');
        });

        // 点击遮罩层关闭侧边栏
        overlay.addEventListener('click', () => {
            aside.classList.remove('visible');
        });

        aside.addEventListener('transitionend', () => {
            mainWidth();
        });



        window.addEventListener('resize', () => {
            isLargeScreen();
            mainWidth();
        });



        // 生成标题id
        const headers = article.querySelectorAll('h1, h2, h3, h4, h5, h6');
        function headersId(headers) {
            headers.forEach((header, index) => {
                let base = header.textContent.trim().replace(/[\s\-]+/g, "_").replace(/[^a-zA-Z0-9\u4e00-\u9fff\_]/g, "").replace(/^_+|_+$/g, "").replace(/_+/g, "_");
                header.id = "header_" + base + "_" + index;
            });
        }



        // ==================== 生成多级目录，挂载到nav中 ====================
        
        // 获取nav容器（用于挂载目录）
        const nav = document.querySelector('nav');
        
        // headers变量定义在前面的script标签中：const headers = article.querySelectorAll('h1, h2, h3, h4, h5, h6');
        // 为所有标题生成唯一ID
        headersId(headers);
        
        /**
         * 构建目录树数据结构
         * @param {NodeList} headers - 所有标题元素
         * @returns {Array} 目录树数组
         */
        function buildTocTree(headers) {
            const tree = [];
            const stack = [];
            
            headers.forEach((header, index) => {
                const level = parseInt(header.tagName.charAt(1));
                const item = {
                    id: header.id,
                    text: header.textContent.trim(),
                    level: level,
                    children: []
                };
                
                // 找到正确的父节点
                while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                    stack.pop();
                }
                
                if (stack.length === 0) {
                    tree.push(item);
                } else {
                    stack[stack.length - 1].children.push(item);
                }
                
                stack.push(item);
            });
            
            return tree;
        }
        
        /**
         * 递归渲染目录树
         * @param {Array} tree - 目录树数组
         * @param {HTMLElement} container - 容器元素
         * @param {Array} indices - 当前索引路径
         * @param {number} currentLevel - 当前层级
         */
        function renderTocTree(tree, container, currentLevel = 1) {
            const ol = document.createElement('ol');

            tree.forEach((item) => {
                const li = document.createElement('li');

                // 判断是否有可显示的子节点
                const hasVisibleChildren = item.children.length > 0 && currentLevel < 3;

                // 创建展开/折叠按钮（仅 h1 和 h2 显示）
                const toggleBtn = document.createElement('span');
                toggleBtn.className = 'toggle-btn' + (!hasVisibleChildren ? ' leaf' : '');
                toggleBtn.innerHTML = '▶';
                // 绑定展开/折叠事件
                if (hasVisibleChildren) {
                    toggleBtn.addEventListener('click', (e) => {
                        e.stopPropagation(); // 阻止事件冒泡
                        handleToggleClick(toggleBtn, li);
                    });
                }

                // 创建链接元素（仅包含文字）
                const link = document.createElement('a');
                link.href = '#' + item.id;
                link.dataset.target = item.id;
                link.dataset.level = currentLevel;

                // 创建文本
                const textSpan = document.createElement('span');
                textSpan.className = 'toc-text';
                textSpan.textContent = item.text;
                textSpan.style.overflow = 'hidden';
                textSpan.style.textOverflow = 'ellipsis';
                textSpan.style.whiteSpace = 'nowrap';

                // 组装链接
                link.appendChild(textSpan);

                // 创建目录项容器，包含链接和按钮（按钮在文字后面）
                const tocItem = document.createElement('div');
                tocItem.className = 'toc-item';
                tocItem.appendChild(link);      // 先添加链接（靠左）
                tocItem.appendChild(toggleBtn); // 再添加按钮（靠右）
                li.appendChild(tocItem);

                // 递归渲染子目录（最多渲染到h3，即currentLevel <= 2）
                if (item.children.length > 0 && currentLevel < 3) {
                    const childOl = renderTocTree(item.children, li, currentLevel + 1);
                    // 默认折叠h2及以下的子目录
                    if (currentLevel >= 1) {
                        childOl.classList.add('toc-children');
                    }
                }

                ol.appendChild(li);
            });

            container.appendChild(ol);
            return ol;
        }
        
        /**
         * 处理展开/折叠按钮点击事件
         * @param {HTMLElement} toggleBtn - 展开/折叠按钮
         * @param {HTMLElement} li - 目录项li元素
         */
        function handleToggleClick(toggleBtn, li) {
            const childOl = li.querySelector('ol');
            if (!childOl) return;
            
            const isExpanded = childOl.classList.contains('expanded');
            
            if (isExpanded) {
                childOl.classList.remove('expanded');
                toggleBtn.classList.remove('expanded');
            } else {
                childOl.classList.add('expanded');
                toggleBtn.classList.add('expanded');
            }
        }
        
        /**
         * 处理目录项点击事件（仅处理链接跳转）
         * @param {Event} e - 点击事件
         */
        function handleTocClick(e) {
            const link = e.currentTarget;
            
            // 平滑滚动到目标位置
            const targetId = link.dataset.target;
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                e.preventDefault();
                
                // 计算滚动位置，减去 header 高度（50px）和额外间距（20px），避免标题被 header 盖住
                const headerHeight = 50;
                const offset = 20;
                const targetPosition = targetElement.offsetTop - headerHeight - offset;
                
                // main变量定义在前面的script标签中
                main.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // 更新URL hash
                history.pushState(null, null, '#' + targetId);
            }
        }
        
        /**
         * 更新当前激活的目录项
         * 仅高亮当前可见的章节，不自动展开/折叠目录
         */
        function updateActiveTocItem() {
            // main变量定义在前面的script标签中：const main = document.querySelector('main');
            const scrollPos = main.scrollTop + 100;
            let currentHeader = null;
            
            // 找到当前可见的标题
            headers.forEach(header => {
                const headerTop = header.offsetTop;
                if (headerTop <= scrollPos) {
                    currentHeader = header;
                }
            });
            
            // 移除所有激活状态
            nav.querySelectorAll('a').forEach(link => {
                link.classList.remove('active');
            });
            
            // 激活当前项（仅高亮，不自动展开父级目录）
            if (currentHeader) {
                const activeLink = nav.querySelector(`a[data-target="${currentHeader.id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        }
        
        // ==================== 初始化目录 ====================
        
        // 构建并渲染目录树
        const tocTree = buildTocTree(headers);
        renderTocTree(tocTree, nav);
        
        // 绑定点击事件
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', handleTocClick);
        });
        
        // 监听滚动事件，使用节流优化性能
        let ticking = false;
        main.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateActiveTocItem();
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        // 初始化激活状态
        updateActiveTocItem();

        // ==================== 多级目录生成完成 ====================