var app = angular.module("MyApp", []);
var corsProxy = 'http://www.corsproxy.com/'; //For testing
//var corsProxy = 'http://'; //For deployment
var url = corsProxy + 'inf5750-12.uio.no/api/dataElements.json?fields=*';
var baseURL = corsProxy + 'inf5750-12.uio.no/api/dataElements';

// "Cahing" the options jsons globaly as they are used by multilpe controllers.
var optionSet = null;
var legendSet = null;
var categoryCombos = null;
var catCombDefault = null;
var mainDataElementGroups = null;
var trackerBasedData = null;

var elementsPerPage = "20";
var currentParam = "";
var searchString = "";
var ENTER_KEY = 13;
var animationSpeed = 250;
var loaded = false;
var descendingModifiedSort = false;
var useSearchPaging = false;

TypeEnum = {
    ERROR: "Error",
    SUCCESS: "Success",
    INFO: "Info"
}

app.filter('capitalize', function()
{
    return function(input)
    {
        return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
    };
});

app.filter('toReadableDate', function()
{
    return function(input)
    {
        var d = new Date(input);
        return d.toLocaleDateString() + " " + d.toLocaleTimeString();
    };
});

app.controller("PostsCtrl", function($scope, $http)
{
    $http.defaults.headers.common.Authorization = 'Basic YWRtaW46ZGlzdHJpY3Q=';

    $http.get(url + '&pageSize=' + elementsPerPage). //'http://www.corsproxy.com/inf5750-12.uio.no/api/dataElements?pageSize=10'
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

    $scope.showDataElement = function(event, id)
    {
        loadListeners();
        var el = event.target;

        if(el.id !== id + "del" && el.id !== id + "dup")
        {
            $parent = $("[id='" + id + "']");
            $nextElem = $parent.next();
            $nextElem.slideToggle(animationSpeed);
        }
    }

    $scope.delElement = function(id, name)
    {
        var r = confirm("Are you sure you want to delete " + name + "?");
        if (r === true) deleteElement(id);
    }

    $scope.duplicateElement = function(element)
    {
        if(searchString.length === 0) //Empty query, use default.
        {
            var currentPage = $scope.posts.pager.page;
            if($scope.posts.length === 1)
            {
                currentPage -= 1;
                if(currentPage < 1) currentPage = 1;
            }
            saveNewElement(angular.toJson(copyElement(element)), function(){ queryAPI(currentPage)}, function(){ displayNotifyModal(TypeEnum.ERROR, "Duplicate failed, for unknown reasons.")});
        }
        else
        {
            saveNewElement(angular.toJson(copyElement(element)),  function(){ queryAPI(-1) }, function(){ displayNotifyModal(TypeEnum.ERROR, "Duplicate failed, for unknown reasons.")});
        }
    }

    $scope.sortAllByModified = function()
    {
        currentParam = parseSearchString("&query=");
        queryAPI(-2);
    }
});

function copyElement(original)
{
    var newElement = {};
    var copyName = "_copy" + Math.floor((Math.random() * 100000));
    newElement.name = original.name + copyName;
    newElement.shortName = original.shortName + copyName;
    newElement.aggregationLevels = original.aggregationLevels;
    newElement.aggregationOperator = original.aggregationOperator;
    newElement.attributeValues = original.attributeValues;
    newElement.dataElementGroups = original.dataElementGroups;
    newElement.dataSets = original.dataSets;
    newElement.domainType = original.domainType;
    newElement.externalAccess = original.externalAccess;
    newElement.items = original.items;
    newElement.numberType = original.numberType;
    newElement.type = original.type;
    newElement.url = original.url;
    newElement.userGroupAccesses = original.userGroupAccesses;
    return newElement;
}


app.controller("AddCtrl", function($scope) {
    $scope.input = {};
    /* Options used by the selects */
    $scope.domainTypes = ['Aggregate', 'Tracker'];
    $scope.valueTypes = ['Number', 'Text', 'Yes/No', 'Yes only', 'Date', 'User name'];
    $scope.numberTypes = ['Number', 'Integer', 'Positive Integer', 'Negative Integer', 'Positive or Zero Integer', 'Unit Inteval', 'Percentage'];
    $scope.textTypes = ['Text', 'Long text'];
    $scope.aggregateOpers = ['Sum', 'Average', 'Count', 'Standard deviation', 'Variance', 'Min', 'Max'];
    $scope.storeZeros = ['No', 'Yes'];
    $scope.aggregationLevels = [];
    one = {};
    one.id = 1;
    one.name = "National";
    two = {};
    two.id = 2;
    two.name = "District";
    three = {}; 
    three.id = 3;
    three.name = "Chiefdom";
    four = {};
    four.id = 4;
    four.name = "Facility";
    $scope.aggregationLevels.push(one); 
    $scope.aggregationLevels.push(two); 
    $scope.aggregationLevels.push(three); 
    $scope.aggregationLevels.push(four); 

    // optSets and optSetComs are the same set!
    getOptions();
    $scope.optSets = optionSet;
    $scope.legendSets = legendSet;
    $scope.catCombs = categoryCombos;
    $scope.mainDataGroups = mainDataElementGroups;
    $scope.trackerBasedDatas = trackerBasedData;

    /* Initial value of the selects */
    $scope.setStartValues = function ()
    {
        $scope.input.domainType = $scope.domainTypes[0];
        $scope.input.valueType = $scope.valueTypes[0];
        $scope.input.numberType =  $scope.numberTypes[0];
        $scope.input.textType =  $scope.textTypes[0];
        $scope.input.aggregateOperator = $scope.aggregateOpers[0];
        $scope.input.storeZero = $scope.storeZeros[0];
        $scope.input.aggregationLevel = false;
        $scope.input.aggregationLevels = [];
        $scope.input.catComb = catCombDefault;
        $scope.input.shortName = null;
        $scope.input.optSet = null;
        $scope.input.optSetCom = null;
        $scope.input.legendSet = null;
        $scope.input.dataGroup = null;
        $scope.input.trackerData = null;
        $scope.input.rationale = null;
        $scope.input.unitOfMeasure = null;
    };

    $scope.setStartValues();

    $scope.close = function() {
        $scope.input = {}; // Empty on cancel
        $scope.setStartValues();
    };

    $scope.add = function() {
        console.log("DEBUG add");

        $scope.showErrorsCheckValidity = true;
        if ($scope.aForm.$valid) {
            $('.modal').modal('hide');
            displayNotifyModal(TypeEnum.SUCCESS, "New element saved!");
            a = generateValidJson($scope.input);
            console.log(a);
            successCallback = function() {
                displayNotifyModal(TypeEnum.SUCCESS, "New element saved!");            
            };

            failCallback = function() {
                displayNotifyModal(TypeEnum.ERROR, "ERROR in saving element to server!");
            };

            saveNewElement(a, successCallback, failCallback);
            $scope.input = {};
            $scope.setStartValues();
        } else {
            alert("There are invalid fields!");
        }

        //saveNewElement(angular.toJson($scope.element));       
        //saveNewElement(angular.toJson(generateValidJson($scope.input)));

        //$scope.input = {};
    };

});

/**
 * Directiv controlling the validation after input.
 * From the guide at http://blog.yodersolutions.com/bootstrap-form-validation-done-right-in-angularjs/
 */
app.directive('showErrors', function() {
    return {
      restrict: 'A',
      require:  '^form',
      link: function (scope, el, attrs, formCtrl) {
        // find the text box element, which has the 'name' attribute
        var inputEl   = el[0].querySelector("[name]");
        // convert the native text box element to an angular element
        var inputNgEl = angular.element(inputEl);
        // get the name on the text box so we know the property to check
        // on the form controller
        var inputName = inputNgEl.attr('name');

        // only apply the has-error class after the user leaves the text box
        inputNgEl.bind('blur', function() {
          el.toggleClass('has-error', formCtrl[inputName].$invalid);
        });

        scope.$watch(function() {
          return scope.showErrorsCheckValidity;
        }, function(newVal, oldVal) {
          if (!newVal) { return; }
          el.toggleClass('has-error', formCtrl[inputName].$invalid);
        });
      }
    }
});


/**
 * Takes the input from the "New element" modal and tries to make a valid DHIS2 data element json
 */
function generateValidJson(input)
{
    var output = {};

    console.log(1);
    if (input.name !== null) output.name = input.name;
    else return null;
    if (input.shortName !== null) output.shortName = input.shortName;
    else output.shortName = input.name;
    console.log(output.shortName);
    if (input.code !== null) output.code = input.code;
    if (input.description !== null) output.description = input.description;
    if (input.formName !== null) output.formName = input.formName;
    console.log(2);
    if (input.domainType !== null) {
        if (input.domainType === "Aggregate") output.domainType = "AGGREGATE";
        if (input.domainType === "Tracker") output.domainType = "TRACKER";
    } else return null;
   
    console.log(3);
    if (input.valueType !== null) {
        if (input.valueType === 'Number') output.type = "int";
        else if (input.valueType === 'Text') output.type =  "string";
        else if (input.valueType === 'Yes/No') output.type = "bool";
        else if (input.valueType === 'Yes only') output.type = "trueOnly"; 
        else if (input.valueType === 'Date') output.type =  "date";
        else if (input.valueType === 'User Name') output.type = "username";
        else return null;
    } else return null;
    // Set the number/text type fields.
    if (output.type === "int"){
        console.log(4);
        if (input.numberType !== null){
            if (input.numberType === "Number") output.numberType = "number";
            else if (input.numberType === "Integer") output.numberType = "int";
            else if (input.numberType === "Positive Integer") output.numberType = "posInt";
            else if (input.numberType === "Negative Integer") output.numberType = "negInt";
            else if (input.numberType === "Positive or Zero Integer") output.numberType = "zeroPositiveInt";
            else if (input.numberType === "Unit Inteval'") output.numberType = "unitInterval";
            else if (input.numberType === "Percentage") output.numberType = "percentage";
            else return null;
        } else return null;
    } else if (output.type === "string"){
        console.log(5);
        if (input.textType !== null){
            if (input.textType === "Text") output.textType = "text";
            else if (input.textType === "Long text") output.textType = "longText";
            else return null
        } else return null; 
    }

    console.log(6);
    if (input.valueType !== null){
        if (input.valueType === "Number" || input.valueType === "Yes/No"){
            if (input.aggregateOperator === "Sum") output.aggregationOperator = "sum";
            if (input.aggregateOperator === "Average") output.aggregationOperator = "average";
            if (input.aggregateOperator === "Count") output.aggregationOperator = "count";
            if (input.aggregateOperator === "Standard deviation") output.aggregationOperator = "stddev";
            if (input.aggregateOperator === "Variance") output.aggregationOperator = "variance";
            if (input.aggregateOperator === "Min") output.aggregationOperator = "min";
            if (input.aggregateOperator === "Max") output.aggregationOperator = "max";
        } else output.aggregationOperator = "sum";
    } else return null;
    console.log(7);

    if (output.type === "int"){
        if (input.storeZero !== null && input.storeZero !== "Yes") output.zeroIsSignificant = true;   
        else output.zeroIsSignificant = false;   
    } else {
        output.zeroIsSignificant = false;   
    }
    if (input.url !== null) output.url = input.url;
    if (output.domainType === "AGGREGATE"){
        if (input.catComb !== null) {
            output.categoryCombo = input.catComb;
        } else output.categoryCombo = catCombDefault;
    } else output.categoryCombo = catCombDefault;
    
    if (input.optSet !== null) output.optionSet = input.optSet;
    if (input.optSetCom !== null) output.commentOptionSet = input.optSetCom;
    if (input.legendSet !== null) output.legendSet = input.legendSet;

    //TODO

    if (input.aggregationLevel) output.aggregationLevel = input.aggregationLevels;
    else output.aggregationLevel = []; 
    
    if (input.rationale !== null || input.unitOfMeasure !== null){
        output.attributeValues = [];
        if (input.rationale !== null) {
            rat = {};
            rat.value = input.rationale;
            rat.attribute = {};
            rat.attribute.id = "AhsCAtM3L0g";
            rat.attribute.name = "Rationale";
            rat.attribute.created = "2011-12-24T11:24:22.575+0000";
            rat.attribute.lastUpdated = "2011-12-24T11:24:22.575+0000";
            output.attributeValues.push(rat);
        }
        if (input.unitOfMeasure !== null){
            rat = {};
            rat.value = input.unitOfMeasure;
            rat.attribute = {};
            rat.attribute.id = "Y1LUDU8sWBR";
            rat.attribute.name = "Unit of measure";
            rat.attribute.created = "2011-12-24T11:24:22.575+0000";
            rat.attribute.lastUpdated = "2011-12-24T11:24:22.575+0000";
            output.attributeValues.push(rat);
        }
    }
    output.dataElementGroups = [];
    if (input.dataGroup !== null) output.dataElementGroups.push(input.dataGroup);
    if (input.trackerData !== null) output.dataElementGroups.push(input.trackerData);
    output.dataSets = [];
    output.externalAccess = false;
    output.items = [];
    
    return angular.toJson(output);
}


/**
 * Sets the global options JSONs.
 * 
 * Will only download the json once.
 * It would be better to use a cachingFactory
 */
function getOptions() {
    var optionSetURL = corsProxy + 'inf5750-12.uio.no/api/optionSets.json';
    var legendSetURL = corsProxy + 'inf5750-12.uio.no/api/mapLegendSets.json';
    var categoryCombosURL = corsProxy + 'inf5750-12.uio.no/api/categoryCombos.json';
    var mainDataElementGroupsURL = corsProxy + 'inf5750-12.uio.no/api/dataElementGroupSets/XY1vwCQskjX.json';
    var trackerBasedDataURL = corsProxy + 'inf5750-12.uio.no/api/dataElementGroupSets/VxWloRvAze8.json';

    // Only load the jsons the first time.
    if (optionSet === null){ optionSet = getOptionsJSON(optionSetURL).optionSets;}
    if (legendSet === null){ legendSet = getOptionsJSON(legendSetURL).mapLegendSets;}
    if (categoryCombos === null){ categoryCombos = getOptionsJSON(categoryCombosURL).categoryCombos;}
    if (mainDataElementGroups === null){ mainDataElementGroups = getOptionsJSON(mainDataElementGroupsURL).dataElementGroups;}
    if (trackerBasedData === null){ trackerBasedData = getOptionsJSON(trackerBasedDataURL).dataElementGroups;}
   
    // Assuming the possition of the 'defult' can change over time.
    for (var i = 0; i < categoryCombos.length; i++)
    {
        if (categoryCombos[i].name === 'default') {
            catCombDefault = categoryCombos[i];
            break;
        }
    }
}


/**
 * Gets the JSON objects used to get options.
 *
 * Useses 'async: false'. This causes load time to
 * increse some when using corsProxy. Hopefully the
 * load time is lower when it's runned on DHIS2.
 *
 * The elementsPerPage = 1000 is a quick hack. 
 * One could run into jsons lager then 1000..
 * but as the data is used in creating dropdown menues
 * such lage jsons are impractical.
 *
 * @param jsonURL
 *      Url of the JSON.
 */
function getOptionsJSON(jsonURL)
{
    var elementsPerPage = 1000; //TODO set this dynamically
    var out;

    $.ajax({
        type:"GET",
        beforeSend: function (request)
        {
            request.setRequestHeader("Authorization", 'Basic YWRtaW46ZGlzdHJpY3Q=');
        },
        url: jsonURL + '?pageSize=' + elementsPerPage,
        async: false,
        success: function(data)
        {
            out = data;
        },
        error: function()
        {
            console.log("Error in getting options!");
        }
    });

    return out;
}


/**
 * TODO: Test!, fix the success/alert divs
 * TODO: We made a new modal-type error and success-message, but two modal windows cant be displayed at the same time, so we didn't change yours, but moved it.
 * NB: we removed JSON.stringify, because it fucked up all the json posting. //JSON.stringify()
 */
function saveNewElement(newElement, successCallback, errorCallback)
{
    console.log(newElement);
    console.log(successCallback);
    console.log(errorCallback);

    $("body").css("cursor", "progress"); //Sets busy cursor while querying API 
    $.ajax({
        type:"POST",
        beforeSend: function (request)
        {
            request.setRequestHeader("Authorization", 'Basic YWRtaW46ZGlzdHJpY3Q=');
        },
        url: baseURL,
        data: newElement,
        contentType: "application/json", //; charset=utf-8
        success: function(data)
        {
            $("body").css("cursor", "default"); //Restore cursor when done

            if(successCallback) successCallback();
            else $("#successDiv").slideToggle(0);
        },          
        error: function(data, status)
        {
            $("body").css("cursor", "default"); //Restore cursor when done
            if(errorCallback) errorCallback();
            else $(".alertDiv").slideToggle(0);
        }
    });
}

/**
 * Deletes a data element from the server, by sending a Http Delete request.
 * Also handles removing of the element in the displayed list and any messages to the user.
 * @param id Id of element to delete and remove
 */
function deleteElement(id)
{
    $("body").css("cursor", "progress"); //Sets busy cursor while querying API
    $.ajax({
        type:"DELETE",
        beforeSend: function (request)
        {
            request.setRequestHeader("Authorization", 'Basic YWRtaW46ZGlzdHJpY3Q=');
        },
        url: baseURL + "/" + id,
        success: function(data, status)
        {
            console.log(status);
            $("body").css("cursor", "default"); //Restore cursor when done
            removeElementFromList(id);
            displayNotifyModal(TypeEnum.SUCCESS, "The element with id=" + id + " was safely deleted from the server.");
        },
        error:function(data, status)
        {
            $("body").css("cursor", "default"); //Restore cursor when done
            displayNotifyModal(TypeEnum.ERROR, "Could not contact the server! No element was deleted.");
        }
    });
}

/**
 * Displays a generic notification to the user as a modal window.
 * @param type Type of window (see TypeEnum)
 * @param text Text to display
 */
function displayNotifyModal(type, text)
{
    $("#notifyModalTitle").html(type + "!");
    if(type === TypeEnum.ERROR)
    {
        $("#notifyModalContent").html('<div class="alert alert-danger"><strong>Error! </strong>' + text + '</div>');
        $("#notifyModal").modal('toggle');
    }
    else if(type === TypeEnum.SUCCESS)
    {
        $("#notifyModalContent").html('<div class="alert alert-success"><strong>Success! </strong>' + text + '</div>');
        $("#notifyModal").modal('toggle');
    }
    else
    {
        console.log("Lol, too few or incorrect arguments used when calling displayModal(..)");
    }
}

/**
 * Removes an element from the underlying array of the main data-element list.
 * @param id ID of element to remove.
 */
function removeElementFromList(id)
{
    var scope = angular.element($("#mainContent")).scope();
    for(var i = 0; i < scope.posts.dataElements.length; i++)
    {
        if(scope.posts.dataElements[i].id === id)
        {
            scope.$apply( function()
            {
                scope.posts.dataElements.splice(i, 1);
            });
        }
    }
}

/**
 * Creates click-listeners for various purposes.
 */
function loadListeners()
{
    if(loaded) return; //The loaded variable ensures that the event-binding is only done once.

    //Handles changing of text in bootstrap-style dropdown-menus, which were originally designed for only displaying a group of links.
    $(".dropdown-menu li a").click(
        function()
        {
            var selText = $(this).text();
            $(this).parents('.btn-group').find('.dropdown-toggle').html(selText+' <span class="caret"></span>');
        }
    );
    loaded = true;
}


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
        if(useSearchPaging)
        {
            currentParam = parseSearchString("&filter=name:like:");
            queryAPI(1);
        }
        else
        {
            currentParam = parseSearchString("&query=");
            queryAPI(-1);
        }
        console.log(currentParam);
    }
}

function parseSearchString(input)
{
    if(searchString.indexOf("user:") == 0)
    {
        var userName = "";
        if(searchString.indexOf('"') === 5)
        {
            userName = searchString.substring(6, searchString.indexOf('"', 6));
            return input + searchString.substring(searchString.indexOf('"', 6)+1).trim() + "&filter=user.name:like:" + userName;
        }
        else
        {
            var spaceIndex = searchString.indexOf(' ', 5);
            if(spaceIndex === -1)
                return input + "&filter=user.name:like:" + searchString.substring(5);

            userName = searchString.substring(5, searchString.indexOf(' ', 5));
            return input + searchString.substring(searchString.indexOf(' ', 5)).trim() + "&filter=user.name:like:" + userName;
        }
    }
    return input + searchString;
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
    loaded = false;

    $("body").css("cursor", "progress"); //Sets busy cursor while querying API
    $.ajax({
        type:"GET",
        beforeSend: function (request)
        {
            request.setRequestHeader("Authorization", 'Basic YWRtaW46ZGlzdHJpY3Q=');
        },
        url: url + '&pageSize=' + elementsPerPage + '&page=' + pageNr,
        success: function(data)
        {
            var scope = angular.element($("#mainContent")).scope();
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
                else if(pageNr === -2) //Display all elements by modified date
                {
                    sortResultsByModified(data.dataElements);
                    scope.posts = data;
                    scope.totalNrOfElements = "(" + data.dataElements.length + " total)";
                    document.getElementById('pageNavigator').innerHTML = "";
                }
            });
            $("body").css("cursor", "default"); //Restore cursor when done
        },
        error: function()
        {
            $("body").css("cursor", "default"); //Restore cursor when done
        }
    });
}

function sortResultsByModified(array)
{
    array.sort(function(a, b)
    {
        if(descendingModifiedSort)
            return a.lastUpdated < b.lastUpdated ? -1 : (a.lastUpdated > b.lastUpdated ? 1 : 0);
        else
            return a.lastUpdated < b.lastUpdated ? 1 : (a.lastUpdated > b.lastUpdated ? -1 : 0);
    });
    descendingModifiedSort = !descendingModifiedSort;
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
    descendingModifiedSort = false;
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


/*
$(".panel-heading").click(function ()
{
    alert(" Yo ");
    $header = $(this);
    //getting the next element
    $content = $header.next();
    //open up the content needed - toggle the slide- if visible, slide up, if not slidedown.
    $content.slideToggle(500);

    //, function () {
        //execute this after slideToggle is done
        //change text of header based on visibility of content div
     //   $header.text(function ()
     //   {
            //change text based on condition
     //       return $content.is(":visible") ? "Collapse" : "Expand";
     //   });
    //});

});
*/
