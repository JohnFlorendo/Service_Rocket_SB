/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/message'],
/**
 * @param{message} message
 */
function(message) {

    function pageInit(scriptContext) {

    }

    function deleteTimeMaster(stURL) {
        var isConfirmed = window.confirm('Deleting all the Time Master records for this sales order.');
        if(isConfirmed){
            var popup = window.open(stURL);
            popup.close();
            message.create({
                title: "Deleting...",
                message: "Deleting all Time Master records under this sales order. Please wait for 3-5 minutes to finish.",
                type: message.Type.INFORMATION
            }).show(5000);
        }
    }


    return {
        pageInit: pageInit,
        deleteTimeMaster : deleteTimeMaster
    };
    
});
