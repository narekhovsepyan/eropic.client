angular.module("app").
    config(["$translateProvider", "_env", function($translateProvider, _env) {
        var en = {
            search: {
                placeholder: "Search here",
                cancel: "Cancel",
                tabs: {
                    recent: "Recent",
                    categories: "Categories",
                    tags: "Tags"
                },
                recent: {
                    label: "Add a recent search"
                },
                empty: {
                    title: "Enter Search"
                }
            },
            filter: {
                age: {
                    title: "Age",
                    all: "All",
                    today: "Today",
                    week: "Week",
                    month: "Month",
                    half_year: "Half year",
                    year: "Year"
                },
                mosaic: {
                    title: "Mosaiced",
                    all: "All",
                    mosaiced: "Mosaiced",
                    non_mosaiced: "Non-mosaiced",
                    unsorted: "Unsorted"
                },
                sort: {
                    title: "Sort",
                    date: "Upload date",
                    views: "Views",
                    votes: "Votes",
                    favourites: "Favourites"
                }
            },
            albums: {
                filterLabel: {
                    topPage: "Top page",
                    albumsFound: "Albums found: {{count}}"
                },
                loadMore: "Load more albums"
            },
            album: {
                blogNameStub: "original URL",
                vote: {
                    message: "Would you recommend this album?",
                    thanks: "Thanks for voting"
                }
            },
            other: {
                notification: {
                    albumNotFound: "Sorry, we can't find that album",
                    oldBrowser: "In order to fully enjoy site you need a modern browser. Please upgrade to <a target='_blank' href='http://www.microsoft.com/en-us/download/internet-explorer-11-for-windows-7-details.aspx'>IE.10</a> or newer, or the lastest version of <a target='_blank' href='https://www.google.com/chrome/browser/desktop/'>Chrome</a> or <a target='_blank' href='https://www.mozilla.org/en-US/firefox/new/'>Firefox</a>",
                    "5xx": "We are currently experiencing problems with our server. Please try reloading the page."
                }
            }
        };

        var ja = {
            search: {
                placeholder: "ここを検索",
                cancel: "キャンセル",
                tabs: {
                    recent: "最近",
                    categories: "項目",
                    tags: "タグ"
                },
                recent: {
                    label: "最近の検索"
                },
                empty: {
                    title: "検索を入力"
                }
            },
            filter: {
                age: {
                    title: "期間",
                    all: "全て",
                    today: "今日",
                    week: "週",
                    month: "月",
                    half_year: "半年",
                    year: "年"
                },
                mosaic: {
                    title: "修正",
                    all: "全て",
                    mosaiced: "修正",
                    non_mosaiced: "無修正",
                    unsorted: "無整理"
                },
                sort: {
                    title: "ソート",
                    date: "アップした日日",
                    views: "ビュー数",
                    votes: "票数",
                    favourites: "お気に入り"
                }
            },
            albums: {
                filterLabel: {
                    topPage: "トップページ",
                    albumsFound: "見つかったアルバム {{count}}"
                },
                loadMore: "もっと見る"
            },
            album: {
                blogNameStub: "元URL",
                vote: {
                    message: "このアルバムを評価して下さい！",
                    thanks: "ありがとうございます。"
                }
            },
            other: {
                notification: {
                    albumNotFound: "指定されたアルバムが見つかりません。",
                    oldBrowser: "お客様が現在ご利用のブラウザは対応しておりません。<a target='_blank' href='http://www.microsoft.com/ja-jp/download/internet-explorer-11-for-windows-7-details.aspx'>IE10</a>以上か最新の<a target='_blank' href='https://www.mozilla.org/ja/firefox/new/'>Firefox</a>、<a target='_blank' href='https://www.google.co.jp/intl/ja/chrome/browser/desktop/'>Google Chrome</a>をご利用下さい。",
                    "5xx": "サーバーエラーが発生しました。お手数ですがページを更新してください。"
                }
            }
        };

        $translateProvider
            .translations("en", en)
            .translations("ja", ja)
            .fallbackLanguage("en");

        if (_env.isProd()) {
            $translateProvider.preferredLanguage("ja");
        } else {
            $translateProvider.determinePreferredLanguage();
        }
    }]);