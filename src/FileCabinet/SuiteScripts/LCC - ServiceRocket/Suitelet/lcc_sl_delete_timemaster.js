/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search','../Library/lcc_lib_timemaster.js'],
/**
 * @param{record} record
 * @param{search} search
 */
function(record, search,libHelper) {
    function onRequest(context) {
        if(context.request.method == 'GET'){
            var recId = context.request.parameters['timemasterid'];
            if(recId){
              var arrTimeMasters =  libHelper.searchTimeMasterBySalesOrderCharge(recId);
              if(arrTimeMasters.length > 0){
                  for(var t = 0; t < arrTimeMasters.length; t++){
                      var deletedId = record.delete({
                          type  : 'customrecord_sr_time_master',
                          id : arrTimeMasters[t]
                      });

                      if(deletedId){
                          log.debug('SUCESSFULLY DELETED id : ' + deletedId);
                      }
                  }
              }
            }
        }

    }

    return {
        onRequest: onRequest
    };
    
});
