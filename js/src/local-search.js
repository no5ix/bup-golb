// ✅ 严格模式的好处
    // ✔ 提高代码安全性（防止未声明变量、全局污染）
    // ✔ 提高代码可读性（禁止重复参数、with 语句等）
    // ✔ 更好的性能优化（某些优化仅在严格模式下启用）
// ❌ 何时不推荐使用？
    // 	•	旧代码可能不兼容（如果代码依赖于非严格模式特性）。
    // 	•	某些第三方库可能没有适配严格模式。
'use strict';  // 严格模式

let db; // 全局数据库变量
var is_load_xml_finished = 0;
var keywords = [];
var xml_resp_cache = null;
var temp_keyword = "";

let content_result_li_map = new Map();
let title_result_li_map = new Map();

// 是否为第一个字母被键入的标志位
var first_char_flag = 0;


var content_id = isMobile() ? "local-search-result-mobile" : "local-search-result-pc";
var input_box = document.getElementById('local-search-input');
var resultContent = document.getElementById(content_id);
const searchButton = document.getElementById('search-button');
const closeButton = document.getElementById('local-search-close');

var overlay = document.createElement("div");
overlay.classList.add("local-search-overlay");
document.body.appendChild(overlay);


async function handleSearch() {
    if (keywords.length <= 0) {
        return;
    }
    resultContent.innerHTML = "";
    //   $('#local-search-close').show();
    closeButton.classList.add("show");

    // 0x04. perform local searching
    if (is_load_xml_finished == 0) {
        var local_search_tips =
            "<span class='local-search-loading'>" +
                "The first search may take a few seconds to load ..." +
            "</span>" +
            "<span class='local-search-loading'>" +
                "First, think about a classic algorithm problem, climbing stairs." +
            "</span>" +
            "<span class='local-search-loading'>" +
                "A frog can jump up 1 step at a time, or it can jump up 2 steps. Find out how many ways there are for the frog to jump up a 6-step staircase? And what about an n-step staircase?" +
            "</span>";
        var ProgressBar =
            "<div class='progress-bar'>" +
            "<div class='progress-bar-charge'></div>" +
            "</div>";
        resultContent.innerHTML =
            "<ul class='local-search-empty-ul'>" +
            local_search_tips +
            ProgressBar;
    } else {
        // Retrieve the object from indexedDB
        var xml_resp = await retrieve_search_xml();
        let is_find_any = false;
        xml_resp.forEach(function (data) {
            var isMatch = true;
            // var content_index = [];
            if (!data.title || data.title.trim() === "") {
                data.title = "Untitled";
            }
            var orig_data_title = data.title.trim();
            var data_title = orig_data_title.toLowerCase();
            var orig_data_content = data.content.trim().replace(/<[^>]+>/g, "");  // 比如，当一个字符串中包含<p>mmp</p>时，经过这段代码处理后，将变为 mmp
            var data_content = orig_data_content.toLowerCase();
            var first_occur = -1;
            var index_title = -1;  // 匹配的标题的字符串位置
            let match_title_cnt = 0;  // keywords 搜索关键字 匹配到 标题的次数, 用来让匹配次数越多的标题放在result列表前面 
            let match_content_cnt = 0;  // keywords 搜索关键字 匹配到 正文的次数, 用来让匹配次数越多的放在result列表前面 

            // only match artiles with not empty contents
            if (data_content !== "") {
                var index_content = -1;
                for (let i = 0; i < keywords.length; i++) {
                    let keyword = keywords[i];
                    index_title = data_title.indexOf(keyword);
                    // index_content = (is_sensitive || is_encrypted) ? -1 : data_content.indexOf(keyword);  // 不能搜加密文章,
                    index_content = data_content.indexOf(keyword); //  这样可以搜加密了的文章, 但是搜索结果框不显示正文只显示标题
                    if (index_title < 0 && index_content < 0) {
                        isMatch = false;
                        break;  // 只要 keywords 里有 任何一个元素 在 内容和标题 都搜不到, 就算不match
                    } else {
                        if (index_title >= 0) {
                            match_title_cnt += 1
                        }
                        if (index_content < 0) {
                            index_content = 0;
                        } else {
                            match_content_cnt += 1;
                        }
                        if (i == 0) {  // keywords 里的第一个元素搜到了, 记录一下位置
                            first_occur = index_content;
                        }
                        // content_index.push({index_content:index_content, keyword_len:keyword_len});
                    }
                }
            } else {
                isMatch = false;
            }
            // 0x05. show search results
            if (isMatch && first_occur >= 0) {
                var match_content = "";  // 第一个keywords 里的第一个元素搜到了的位置相邻的文字内容

                const hostname = window.location.hostname;
                var is_encrypted = data.encrypted.trim() == "1";
                var is_sensitive =
                    CONFIG.local_search.sensitive_word &&
                    data_content.indexOf(CONFIG.local_search.sensitive_word) >= 0;
                if (
                    (!is_sensitive && !is_encrypted) ||
                    hostname === "localhost" ||
                    hostname === "127.0.0.1" ||
                    hostname === "::1" ||
                    hostname.startsWith("192")
                ) {
                    // cut out 100 characters
                    var start = first_occur - 20;
                    var end = first_occur + 80;
                    if (start < 0) {
                        start = 0;
                    }
                    if (start == 0) {
                        end = 100;
                    }
                    if (end > orig_data_content.length) {
                        end = orig_data_content.length;
                    }
                    match_content = orig_data_content.substr(start, end);
                }
                // highlight all keywords
                var regS = "";
                if (match_content != "") {
                    // highlight content and title
                    // 如果 HTML 结构中已经包含 <b>，你可以用 replace() 时 跳过 <b> 标签内部的内容，避免重复匹配：
                    let regS = new RegExp(`(?!<b[^>]*?>)(${keywords.join("|")})(?!<\/b>)`, "gi");
                    match_content = match_content.replace(regS, function (match) {
                        return '<b class="search-keyword">' + match + "</b>";
                    });
                    orig_data_title = orig_data_title.replace(regS, function (match) {
                        return '<b class="search-keyword">' + match + "</b>";
                    });
                } else {
                    // highlight title
                    // 如果 HTML 结构中已经包含 <b>，你可以用 replace() 时 跳过 <b> 标签内部的内容，避免重复匹配：
                    let regS = new RegExp(`(?!<b[^>]*?>)(${keywords.join("|")})(?!<\/b>)`, "gi");

                    orig_data_title = orig_data_title.replace(regS, function (match) {
                        return '<b class="search-keyword">' + match + "</b>";
                    });
                }
                let temp_arr = [];
                temp_arr.push(
                    "<li><a href='",
                            decodeURIComponent(data.url),
                            "' class='search-result-title' target='_blank'>",
                            orig_data_title,
                        "</a>",
                        '<p class="search-result">',
                            match_content,
                        " . . .</p>",
                    "</li>"
                );
                if (index_title >= 0) {  // 标题匹配到的话, 优先排在搜索列表结果前面
                    title_result_li_map.set(temp_arr.join(""), match_title_cnt);
                } else {
                    content_result_li_map.set(temp_arr.join(""), match_content_cnt);
                }
                is_find_any = true;
            }
        });

        if (is_find_any) {
            const sorted_title_result_li_str = [...title_result_li_map.entries()]
                .sort((a, b) => b[1] - a[1]) // 降序排序
                .map(entry => entry[0])       // 取出 key（字符串）
                .join("");                    // 连接成字符串
            const sorted_content_result_li_str = [...content_result_li_map.entries()]
                .sort((a, b) => b[1] - a[1]) // 降序排序
                .map(entry => entry[0])       // 取出 key（字符串）
                .join("");                    // 连接成字符串
            // 标题匹配到的话, 优先排在搜索列表结果前面
            resultContent.innerHTML = '<ul class=\"search-result-list\">' + sorted_title_result_li_str + sorted_content_result_li_str + "</ul>";

            title_result_li_map.clear();
            content_result_li_map.clear();
        } else {
            resultContent.innerHTML =
                "<ul class='local-search-empty-ul'><span class='local-search-empty'>404.<span></ul>";
        }
    }
}

// 这个force_close是为了解决: 中文键盘打拼音还没选中文就点击close图标因为此时temp_keyword会有值导致无法关闭search的bug
function CloseLocalSearch(force_close=false, when_delete_all=false) {
    let closeLocalSearchImpl = function() {
        if (!force_close && temp_keyword.length > 0) {
            return;
        }
        $('#local-search-input').val('');
        temp_keyword = "";
        first_char_flag = 0;
        // $('#local-search-close').hide();
        closeButton.classList.remove("show");

        // $('.local-search-result-cls ul li').velocity('stop').velocity('transition.slideDownOut', 200);
        if (isMobile())
        {
            $('#' + content_id).velocity('stop').velocity( 'transition.slideUpOut', 300);

            if (!when_delete_all) {
                input_box.blur();
                // setTimeout(() => {
                //     closeButton.classList.remove("move");
                // }, 1000);
                input_box.classList.remove('expanded');
                enableScroll();  // 调用 `enableScroll()` 解除禁止页面滚动
                overlay.classList.remove("show");
                // console.log("overlay show remove!!!")
            } else {
                return;
            }
        }
        else
        {
            $('#' + content_id).attr("headroom_special_attr","true");   //headroom_special_attr是用来, 当页面滚动的时候local search的结果页面也会跟着一起被收起, 当不写这行代码的时候, 空的result会在页面往上滚的时候出现 ...
            resultContent.classList.remove("smooth-transition");  // 这个是为了"当页面滚动的时候local search的结果页面也会跟着一起被收起"的时候有一个平滑滚动的动画, 这个不能直接写在css里, 不然会影响 velocity的动画

            $('#' + content_id).velocity('stop').velocity( 'transition.slideUpOut', 800);
            // $('#' + content_id).velocity('stop').velocity( 'transition.bounceOut', 800);
            // $('#' + content_id).velocity('stop').velocity( 'transition.slideUpBigOut', 1000);
            // $('#' + content_id).velocity('stop').velocity( 'transition.bounceUpOut', 1000);
            // $('#' + content_id).velocity('stop').velocity( 'transition.expandOut', 600);
            // $('#' + content_id).velocity('stop').velocity( 'transition.whirlOut', 600);
            // $('#' + content_id).velocity('stop').velocity( 'transition.shrinkOut', 600);
            // $('#' + content_id).velocity('stop').velocity( 'transition.swoopOut', 1000);
            // $('#' + content_id).velocity('stop').velocity( 'transition.flipBounceXOut', 600);
            // $('#' + content_id).velocity('stop').velocity( 'transition.fadeOut', 600);
        }
    }

    // if (force_close) {
    //     closeLocalSearchImpl();
    // } else {
        setTimeout(function() {
            // 这个setTimeout的目的是为了解决
            // 1. 当使用中文输入法输入英文的时候敲下enter键的那一瞬间发生从有文字到没文字又到有文字, 而下方window.scrollTo这个还没执行到, 会导致页面scroll乱滚以及velocity动画重复播放; 加了这个timeout之后就可以检测是否属于这种情况
            // 2. 当点了close 按钮, 但是又触发了input的focus事件, 所以加个延迟 150ms
            closeLocalSearchImpl();
        }, 150);
    // }
}

// 定义一个函数用于阻止滚动
function preventScroll(event) {
    if (!event.target.closest(".local-search-result-cls")) {  // 允许 result 的触摸滚动(如果 event.target 没有在 .local-search-result-cls 内部，说明用户触摸的是 body 其他地方，需要阻止滚动)
      event.preventDefault(); // 阻止 默认 的滚动行为, 来阻止body滚动
    }
}

// 禁止滚动
function disableScroll() {
    document.body.style.overflow = "hidden";
    document.addEventListener("touchmove", preventScroll, { passive: false });
}

// 允许滚动
function enableScroll() {
    document.body.style.overflow = "auto";
    document.removeEventListener("touchmove", preventScroll);
}

input_box.addEventListener('input', function () {
    // 0x03. parse query to keywords list
    temp_keyword = this.value.trim();
    if (temp_keyword.length <= 0) {
        CloseLocalSearch(false, true);
        return;
    }

    keywords = temp_keyword.toLowerCase().split(/[\s\-]+/);  // 根据 空格 或者 "-" 来分割, keywords 是用户搜索的单词数组, 如用户搜索"spring boot", 则会变为[spring, boot]
    let lastElement = keywords[keywords.length - 1];
    if (keywords.length > 1 && lastElement.length === 1) {
        // keywords数组里的最后一个字符串为单个字母, 这种情况一般都是手机中文打字, 但是极其耗性能, 因为单字母都能匹配还会导致出来的结果乱码, 但出来都是不想要的结果
        return;
    }
    
    handleSearch();

    // 当用户键入第一个字母的时候的动画处理逻辑 : 
    // 当 first_char_flag 为 0 的时候, 
    // 要播放一个动画
    if (first_char_flag == 0)
    {
        first_char_flag = 1;
        let duration = 600;

        $('#' + content_id).velocity('stop').velocity('transition.slideDownIn', duration);
        if (!isMobile()) {
            $('#' + content_id).removeAttr("headroom_special_attr");  // headroom_special_attr是用来 当页面滚动的时候local search的结果页面也会跟着一起被收起, 当不写这行代码的时候, 空的result会在页面往上滚的时候出现 ...
            setTimeout(()=>{
                resultContent.classList.add("smooth-transition"); // 这个是为了"当页面滚动的时候local search的结果页面也会跟着一起被收起"的时候有一个平滑滚动的动画, 这个不能直接写在css里, 不然会影响 velocity
            }, duration + 200); 
        }
    }
});

// 这里要不要用 click 要用 pointerup, 不然 mac safari 触摸板 tap 得tap两次才能触发这里
$(document).on('pointerup', '#local-search-close', function(event) {
    CloseLocalSearch(true, false);
});

input_box.addEventListener("focus", function() {  // when input get the focus
    if (isMobile()) {
        disableScroll();          // 调用 `disableScroll()` 禁止页面滚动
        input_box.classList.add('expanded');
        overlay.classList.add("show");
    }
});

input_box.addEventListener("blur", function() {  // when input lose the focus
    if (isMobile()) {
        setTimeout(()=> {
            searchButton.disabled = false;
            searchButton.style.pointerEvents = "auto";
        }, 600);

        // console.log("输入框失去焦点2: " + temp_keyword.length);
        if (temp_keyword.length <= 0) {
            enableScroll();  // 调用 `enableScroll()` 解除禁止页面滚动
            overlay.classList.remove("show");
            input_box.classList.remove('expanded');
        }
    }
});

searchButton.addEventListener('click', function() {  // 这里要用click不要用 pointerup, 不然ios可能弹不出键盘
    if (isMobile()) {
        // 使输入框渐变显示
        searchButton.disabled = true;  // 点击之后就禁用, 直到input失焦
        searchButton.style.pointerEvents = "none";
        
        input_box.focus();
        // input_box.classList.add('expanded');
        // disableScroll();          // 调用 `disableScroll()` 禁止页面滚动
        // overlay.classList.add("show");
    }
});

$(document).keyup(function(event){
  switch(event.keyCode) {
    case 27:
    //   alert("ESC");
      CloseLocalSearch(true, false);
  }
});

function isMobile() {
  // console.log(document.body.clientWidth);
  return document.body.clientWidth < 768
}

function getTimestampAsSecond() {
  // console.log(document.body.clientWidth);
  return Math.floor(Date.now() / 1000);
}

function ajax_store_search_xml(xmlTimestamp) {
    console.log("[local search] - ajax downloading search.xml ...");
    $.ajax({
        url: "/search.xml",
        dataType: "xml",
        success: function (xmlResponse) {
            setLocalSearchXMLData(xmlResponse, xmlTimestamp);
        }
    });
}

async function retrieve_search_xml() {
    if (xml_resp_cache) {
      return xml_resp_cache;
    }
    // Retrieve the object from indexedDB
    xml_resp_cache = await getLocalSearchXMLData();
    return xml_resp_cache;
}

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("myDatabase", 1); // 设置为版本号 1, 用indexedDB替代localStorage, 因为indexedDB可以存储大量数据（几百 MB 到几 GB）, 而localStorage只能5MB左右, 
        request.onupgradeneeded = function(event) {
            db = event.target.result;
            if (!db.objectStoreNames.contains("searchData")) {
                const objectStore = db.createObjectStore("searchData", { keyPath: "id" });
                // 可以创建索引以便于查询
                objectStore.createIndex("xmlDataIndex", "xml_data", { unique: false });
            }
        };
        request.onsuccess = function(event) {
            db = event.target.result;
            console.log("[local search] - Database opened successfully.");
            resolve(db);
        };
        request.onerror = function(event) {
            console.error("[local search] - Database open error:", event.target.error);
            reject(event.target.error);
        };
    });
}

async function setLocalSearchXMLData(xmlResponse, xmlTimestamp) {
    if (!db) {
        await openDatabase();  // 确保数据库已打开
    }
    var transaction = db.transaction(["searchData"], "readwrite");
    var objectStore = transaction.objectStore("searchData");

    var xml_data = $("entry", xmlResponse).map(function () {
      return {
        title: $("title", this).text(),
        content: $("content", this).text(),
        url: $("url", this).text(),
        encrypted: $("encrypted", this).text(),
      };
    }).get();
    // 存储数据，主键为 "id"，这里我们将 "id" 设为 "local_search_xml_data"
    var data = { id: "local_search_xml_data", xml_data: xml_data };

    var request = objectStore.put(data);  // 使用 put 可以插入或者更新数据
    request.onsuccess = function() {
        console.log("[local search] - Data successfully stored in indexedDB.");
        localStorage.setItem('last_publish_timestamp', xmlTimestamp);
        is_load_xml_finished = 1;
        // 如果输入框有文字, 等待下载 xml完毕之后再弹出结果
        if (temp_keyword.length > 0) {
            handleSearch();
            $('#' + content_id).velocity('stop').velocity('transition.slideDownIn', 600);
        }
    };
    request.onerror = function(event) {
        console.log("[local search] - Error storing data: ", event.target.error);
    };
}

// 封装 IndexedDB 操作为 Promise
function getLocalSearchXMLData() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("[local search] - Database is not initialized.");
            return;
        }
        var transaction = db.transaction(["searchData"], "readonly");
        var objectStore = transaction.objectStore("searchData");
        var request = objectStore.get("local_search_xml_data");  // 使用 id 获取数据
        request.onsuccess = function(event) {
            if (request.result) {
                // 数据存在，成功处理
                resolve(request.result.xml_data);  // 解析成功并返回结果
            } else {
                // 数据未找到，返回失败
                reject("Data not found");  // 抛出错误
            }
        };
        request.onerror = function(event) {
            // 错误处理
            console.log("[local search] - Error retrieving data: ", event.target.error);
            reject(event.target.error);  // 抛出错误
        };
    });
}

// 使用 async/await 来调用这个函数
async function loadSearchData() {
    try {
        if (!db) {
            await openDatabase();  // 确保数据库已打开
        }
        await getLocalSearchXMLData();  // 等待结果
        is_load_xml_finished = 1;
        console.log("[local search] - load search.xml finished.");
        // console.log("Retrieved data: ", result);
    } catch (error) {
        // console.error("Error: ", error);
        console.log("[local search] - load search.xml not found.");
        ajax_get_new_search_xml_if_exist(true);
    }
}

// 节省流量
function ajax_get_new_search_xml_if_exist(force=false) {
    const hostname = window.location.hostname;
    if (!(hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname.startsWith("192"))) {
        console.log("[local search] - ajax downloading publish_time.xml ...");
        $.ajax({
            url: "/publish_time.xml",  // 这个文件是github action里加上去的, 参见本项目 .github/workflows/pages.yml:151
            dataType: "xml",
            success: function (xmlResponse) {
                // 使用 jQuery 解析 XML 文档并获取时间戳
                const xmlTimestamp = $(xmlResponse).find('publish_timestamp').text(); // 提取 <timestamp> 的文本
                // 从 localStorage 获取存储的时间戳
                const storedTimestamp = localStorage.getItem('last_publish_timestamp') || 0;
                if (force) {
                    ajax_store_search_xml(xmlTimestamp);
                } else {
                    console.log('[local search] - ajax_get_new_search_xml_if_exist, xmlTimestamp: ' + xmlTimestamp + ", storedTimestamp: " + storedTimestamp);
                    if (xmlTimestamp > storedTimestamp) {
                        // download search.xml
                        ajax_store_search_xml(xmlTimestamp);
                    }
                    else {
                        // 调用异步函数
                        loadSearchData();
                    }
                }
            },
            error: function(xhr, status, error) {
                console.error('[local search] - ajax_get_new_search_xml_if_exist 请求失败: ' + error);
                ajax_store_search_xml(getTimestampAsSecond());
            }
        });
    } else {
        ajax_store_search_xml(getTimestampAsSecond());
    }
}

ajax_get_new_search_xml_if_exist();