/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['../Library/sr_lib_invoice_template'],
    function(libTemplate) {

        function onRequest(context) {
            try{
                if (context.request.method === 'GET') {
                    var inTranId = context.request.parameters.tranid;
                    var renderTrans = libTemplate.generatePDF(inTranId);
                    if(inTranId){
                        context.response.renderPdf({ xmlString: renderTrans });
                    }
                }
            }catch (e) {
                log.debug('onRequest=>error',e);
            }
        }
        return {
            onRequest: onRequest
        };

    });
