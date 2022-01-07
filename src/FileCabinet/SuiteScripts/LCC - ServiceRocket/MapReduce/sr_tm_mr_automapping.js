/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/url', 'N/log','../Library/lcc_lib_timemaster.js'], function(search, record, runtime, url, log,libTimeMaster) {
  var exports = {};

  function getInputData() {

    var arrResults = [];
    var searchResults = search.load({
      id: 'customsearch_sr_time_entries_mr'
    });

    var myPagedData = searchResults.runPaged({
      pageSize: 1000
    });

    try {
      myPagedData.pageRanges.forEach(function(pageRange) {
        var myPage = myPagedData.fetch({
          index: pageRange.index
        });
        myPage.data.forEach(function(result) {
          arrResults.push(result);
        });
      });
    } catch (e) {
      log.debug(e);
    }
    return arrResults;

  }

  function map(context) {
    try {

      var searchResult = JSON.parse(context.value);
      // log.debug('searchResult', searchResult);

      var timeBillId = searchResult.id;
      var timeMasterId = libTimeMaster.getTimeMasterRecordsByTimeId(timeBillId);
      // log.debug('timeMasterRecord found', timeMasterId)
      var chargeId = libTimeMaster.getChargeByTimeId(timeBillId);
      // log.debug('CHARGE found', chargeId)

      if (timeMasterId) {
        // log.debug('TIME MASTER RECORD FOUND', timeMasterId)
        if (chargeId) {
          // log.debug('UPDATE TIME MASTER WITH CHARGE' , chargeId);
          libTimeMaster.updateTimeMaster(timeMasterId,timeBillId);
        }else{
          // log.debug('NOT UPDATE TIME MASTER WITHOUT CHARGE');
          libTimeMaster.updateTimeMaster(timeMasterId,timeBillId);
        }
      } else {
        // log.debug('SCRIPT', 'CREATING TIME MASTER');
        libTimeMaster.createTimeMaster(timeBillId, chargeId);
      }
    } catch (error) {
      log.error(error.name, error)
    }
  }


  exports.getInputData = getInputData;
  exports.map = map;
  return exports;
});