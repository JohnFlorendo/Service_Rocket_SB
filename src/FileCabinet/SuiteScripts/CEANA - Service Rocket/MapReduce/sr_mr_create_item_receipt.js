/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/runtime', 'N/search', '../Library/cnt_lib_create_item_receipt'],
    /**
     * @param{runtime} runtime
     * @param{search} search
     */
    (runtime, search, libFieldMapping) => {
        var currScript = runtime.getCurrentScript();

        const getInputData = (inputContext) => {
            var paramSearchId = currScript.getParameter('custscript_sr_purchase_order_search');
            log.debug('paramSearchId', paramSearchId);

            var arrPurchaseOrder = searchAllPurchaseOrder(paramSearchId);

            return arrPurchaseOrder;
        }

        function searchAllPurchaseOrder(paramSearchId) {
            try {
                var arrPurchaseOrder = [];

                var searchObjPurchaseOrder = search.load({
                    id: paramSearchId
                });
                var count = searchObjPurchaseOrder.runPaged().count;
                log.debug('count', count);
                var myPagedData = searchObjPurchaseOrder.runPaged({
                    pageSize: 1000
                });

                try {
                    myPagedData.pageRanges.forEach(function (pageRange) {
                        var myPage = myPagedData.fetch({
                            index: pageRange.index
                        });
                        myPage.data.forEach(function (result) {
                            var inInternalID = result.id;

                            arrPurchaseOrder.push({
                                inInternalID: inInternalID
                            });
                        });
                    });
                } catch (e) {
                    log.debug('second try', e);
                }
            } catch (e) {
                log.debug('first try', e);
            }

            return arrPurchaseOrder;
        }

        const map = (mapContext) => {
            try {
                var objPurchaseOrder = JSON.parse(mapContext.value);
                log.debug('objPurchaseOrder', objPurchaseOrder.inInternalID);
                libFieldMapping.transformPurchaseOrder(objPurchaseOrder.inInternalID);
            } catch (e) {
                log.debug('map -> error', e);
            }
        }

        const reduce = (reduceContext) => {

        }

        const summarize = (summaryContext) => {

        }

        return {getInputData, map}

    });
