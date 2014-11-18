var app = angular.module("MyApp", []);
var url = 'http://www.corsproxy.com/inf5750-12.uio.no/api/dataElements';

app.controller("PostsCtrl", function($scope, $http)
{
    $http.defaults.headers.common.Authorization = 'Basic YWRtaW46ZGlzdHJpY3Q=';

    $http.get('http://www.corsproxy.com/inf5750-12.uio.no/api/dataElements?pageSize=10').
        success(function(data, status, headers, config)
        {
            $scope.posts = data;
            $scope.pageInfo = data.pager;
            makePageNav(data.pager);
        }).
        error(function(data, status, headers, config)
        {
            alert(status);
        });

    /**
     * Creates a paginator-navigation-bar at the bottom, and highlights the currently selected page.
     * Renders a maximum of 5 page-links at a time (TODO: condsider changing???).
     * TODO: consider implementing input field for "direct"-jump to a page.
     * TODO: The links dont actually work at this time.
     * @param pageInfo
     */
    function makePageNav(pageInfo)
    {
    /*<li class="disabled"><a href="#"><span aria-hidden="true">&laquo;</span><span class="sr-only">Previous</span></a></li>
    <li class="active"><a href="#">1 <span class="sr-only">(current)</span></a></li>
    <li class="enabled"><a href="#"><span aria-hidden="true">&raquo;</span><span class="sr-only">Next</span></a></li>*/

        // ** LEFT ARROW ** //
        var leftArrow = "";
        if(pageInfo.page !== 1) leftArrow = "<li class=\"enabled\"><a href=\"" + (pageInfo.page - 1) + "\"><span aria-hidden=\"true\">&laquo;</span><span class=\"sr-only\">Previous</span></a></li>";
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
                    numberHtml += "<li><a href=\"#\">" + i + "</a></li>";
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
                    numberHtml += "<li><a href=\"#\">" + i + "</a></li>";
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
                    numberHtml += "<li><a href=\"#\">" + i + "</a></li>";
                }
            }
        }

        // ** RIGHT ARROW ** //
        var rightArrow = "";
        if(pageInfo.page === pageInfo.pageCount)
            rightArrow = "<li class=\"disabled\"><a href=\"" + (pageInfo.page + 1) + "\"><span aria-hidden=\"true\">&raquo;</span><span class=\"sr-only\">Next</span></a></li>";
        else
            rightArrow = "<li class=\"enabled\"><a href=\"#\"><span aria-hidden=\"true\">&raquo;</span><span class=\"sr-only\">Next</span></a></li>";


        // Add the whole thingamagig to the html.
        document.getElementById('pageNavigator').innerHTML = leftArrow + numberHtml + rightArrow;
    }
});
