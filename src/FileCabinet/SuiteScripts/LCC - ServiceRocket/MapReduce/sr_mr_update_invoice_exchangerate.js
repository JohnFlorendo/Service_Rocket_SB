/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/url','../Library/lcc_lib_timemaster.js'], function(search, record, runtime, url,libTimeMaster) {
    var exports = {};
    var scriptObj = runtime.getCurrentScript();

    function getInputData() {
        var arrResults = [];
        var searchID = scriptObj.getParameter({name: 'custscript_inv_savesearch'}); // **Script Use - Invoices to Update Exchange Rate
        var searchResults = search.load({ id: searchID });
        var columns = searchResults.columns
        var myPagedData = searchResults.runPaged({ pageSize: 1000 });
        myPagedData.pageRanges.forEach(function(pageRange) {
            var myPage = myPagedData.fetch({ index: pageRange.index });
            myPage.data.forEach(function(result) {
                var objData = {};
                for(var intIndex in columns) {
                    objData[columns[intIndex].name] = result.getValue(columns[intIndex])
                }
                objData["recordid"] = result.id;
                arrResults.push(objData);
            });
        });

        return arrResults;
    }

    function map(context) {
        try {
            var searchResult = JSON.parse(context.value);
            
            log.debug('searchResult', searchResult);
            
        } catch (error) { log.error(error.name, error); }
    }


    exports.getInputData = getInputData;
    exports.map = map;
    return exports;
});