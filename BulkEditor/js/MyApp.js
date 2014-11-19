var app = angular.module("MyApp", []);
var url = 'http://www.corsproxy.com/inf5750-12.uio.no/api/dataElements.json';
var elementsPerPage = "20";
var currentParam = "";
var searchString = "";
var ENTER_KEY = 13;

app.controller("PostsCtrl", function($scope, $http)
{
    $http.defaults.headers.common.Authorization = 'Basic YWRtaW46ZGlzdHJpY3Q=';

    $http.get(url + '?pageSize=' + elementsPerPage). //'http://www.corsproxy.com/inf5750-12.uio.no/api/dataElements?pageSize=10'
        success(function(data, status, headers, config)
        {
            $scope.posts = data;
            $scope.pageInfo = data.pager;
            $scope.totalNrOfElements = "(" + data.pager.total + " total)";
            makePageNav(data.pager);
        }).
        error(function(data, status, headers, config)
        {
            alert(status);
        });
});

document.getElementById('searchBar').onkeypress = function(event)
{
    if (!event) event = window.event;
    var keyCode = event.keyCode || event.which;
    if (keyCode === ENTER_KEY)
    {
        search();
    }
};

/**
 * Called when user presses the Search-button or "Enter" in the search field.
 * Queries the api for dataElements matching the query-string.
 */
function search()
{
    searchString = document.getElementById("searchBar").value;
    if(searchString.length === 0) //Empty query, use default.
    {
        currentParam = "";
        queryAPI(1);
    }
    else
    {
        currentParam = "&query=" + searchString;
        queryAPI(-1);
    }
}

/**
 * Called when user navigates to a different page,
 * retrieves the results corresponding to that page.
 * E.g. page 7 contains from element nr. (6 * nr of elements per page) to element nr. (7 * nr of elements per page).
 *
 * Also called when a user searches for a word.
 * @param pageNr Page to display or -1 for search.
 */
function queryAPI(pageNr)
{
    $("body").css("cursor", "progress"); //Sets busy cursor while querying API
    $.ajax({
        type:"GET",
        beforeSend: function (request)
        {
            request.setRequestHeader("Authorization", 'Basic YWRtaW46ZGlzdHJpY3Q=');
        },
        url: url + '?pageSize=' + elementsPerPage + '&page=' + pageNr + currentParam,
        success: function(data)
        {
            var scope = angular.element($("#hereBeDragons")).scope();
            scope.$apply(function()
            {
                if(pageNr > 0)
                {
                    scope.posts = data;
                    scope.totalNrOfElements = "(" + data.pager.total + " total)";
                    scope.pageInfo = data.pager;
                    makePageNav(data.pager);
                }
                else if(pageNr === -1) //Search
                {
                    sortResults(data.dataElements);
                    scope.posts = data;
                    scope.totalNrOfElements = "(" + data.dataElements.length + " total)";
                    document.getElementById('pageNavigator').innerHTML = "";
                }
            });
            $("body").css("cursor", "default"); //Restore cursor when done
        }
    });
}

/**
 * Sorts a list of data-elements by prioritizing words by relevance
 * then falls back to alphabetical order.
 * @param array
 */
function sortResults(array)
{
    var regex = new RegExp("^" + searchString + " ", "i");
    var regex2 = new RegExp(" " + searchString + " ", "i");
    var regex3 = new RegExp("^" + searchString, "i");
    var regex4 = new RegExp(" " + searchString, "i");

    array.sort(function(a, b)
    {
        if (a.name.toLowerCase() == searchString) return -1;
        if (b.name.toLowerCase() == searchString) return 1;

        // Name starts with query-string then space
        if (regex.test(a.name) && regex.test(b.name))
            return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0);
        else if (regex.test(a.name)) return -1;
        else if (regex.test(b.name)) return 1;

        // Name contains space then query-string then space
        if (regex2.test(a.name) && regex2.test(b.name))
            return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0);
        else if (regex2.test(a.name)) return -1;
        else if (regex2.test(b.name)) return 1;

        // Name starts with query-string
        if (regex3.test(a.name) && regex3.test(b.name))
            return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0);
        else if (regex3.test(a.name)) return -1;
        else if (regex3.test(b.name)) return 1;

        // Name ends with query-string
        if (regex4.test(a.name) && regex4.test(b.name))
            return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0);
        else if (regex4.test(a.name)) return -1;
        else if (regex4.test(b.name)) return 1;

        // Name contains query-string, alphabetical sort.
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0);
    });
}

/**
 * Creates a paginator-navigation-bar at the bottom, and highlights the currently selected page.
 * Renders a maximum of 5 page-links at a time (TODO: condsider changing???).
 * TODO: consider implementing input field for "direct"-jump to a page.
 * @param pageInfo
 */
function makePageNav(pageInfo)
{
    // ** LEFT ARROW ** //
    var leftArrow = "";
    if(pageInfo.page !== 1) leftArrow = "<li class=\"enabled\"><a onClick=\"queryAPI(" + (pageInfo.page - 1) + "); return false;\" href=\"#\"><span aria-hidden=\"true\">&laquo;</span><span class=\"sr-only\">Previous</span></a></li>";
    else leftArrow = "<li class=\"disabled\"><a href=\"#\"><span aria-hidden=\"true\">&laquo;</span><span class=\"sr-only\">Previous</span></a></li>";

    // ** NUMBER LINKS ** //
    var numberHtml = "";
    if(pageInfo.page <= 3) // Selected link should be on the left side or middle (1,2 or 3) - [<<] [1] [2] [3] [4] [5] [>>]
    {
        var toPage = Math.min(5, pageInfo.pageCount);

        for(var i = 1; i <= toPage; i++)
        {
            if(i === pageInfo.page)
            {
                numberHtml += "<li class=\"active\"><a href=\"\">" + i + "<span class=\"sr-only\">(current)</span></a></li>";
            }
            else
            {
                numberHtml += "<li><a onClick=\"queryAPI(" + i + "); return false;\" href=\"#\">" + i + "</a></li>";
            }
        }
    }
    else if(pageInfo.page >= (pageInfo.pageCount-2)) // Selected link should be on the right side or middle (n, n-1 or n-2) - [<<] [n-4] [n-3] [n-2] [n-1] [n] [>>]
    {
        var fromPage = Math.max(1, pageInfo.pageCount-4);

        for(var i = fromPage; i <= pageInfo.pageCount; i++)
        {
            if(i === pageInfo.page)
            {
                numberHtml += "<li class=\"active\"><a href=\"\">" + i + "<span class=\"sr-only\">(current)</span></a></li>";
            }
            else
            {
                numberHtml += "<li><a onClick=\"queryAPI(" + i + "); return false;\" href=\"#\">" + i + "</a></li>";
            }
        }
    }
    else // Selected link should be in the middle (k) - [<<] [k-2] [k-1] [k] [k+1] [k+2] [>>]
    {
        for(var i = pageInfo.page-2; i <= pageInfo.page+2; i++)
        {
            if(i === pageInfo.page)
            {
                numberHtml += "<li class=\"active\"><a href=\"\">" + i + "<span class=\"sr-only\">(current)</span></a></li>";
            }
            else
            {
                numberHtml += "<li><a onClick=\"queryAPI(" + i + "); return false;\" href=\"#\">" + i + "</a></li>";
            }
        }
    }

    // ** RIGHT ARROW ** //
    var rightArrow = "";
    if(pageInfo.page === pageInfo.pageCount)
        rightArrow = "<li class=\"disabled\"><a href=\"#\"><span aria-hidden=\"true\">&raquo;</span><span class=\"sr-only\">Next</span></a></li>";
    else
        rightArrow = "<li class=\"enabled\"><a onClick=\"queryAPI(" + (pageInfo.page + 1) + "); return false;\" href=\"#\"><span aria-hidden=\"true\">&raquo;</span><span class=\"sr-only\">Next</span></a></li>";


    // Add the whole thingamagig to the html.
    document.getElementById('pageNavigator').innerHTML = leftArrow + numberHtml + rightArrow;
}



