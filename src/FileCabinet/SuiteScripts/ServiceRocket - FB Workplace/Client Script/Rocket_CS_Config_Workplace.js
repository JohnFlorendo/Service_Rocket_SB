/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

function() {


    function saveRecord(scriptContext) {
        var currRec = scriptContext.currentRecord;
        var stToken = document.getElementById('tokenkey').value;
        log.debug('stToken',stToken);
        if(stToken){
            currRec.setValue('custrecord_int_wp_access_token',stToken);
        }

        return true;
    }

    return {
        saveRecord: saveRecord
    };
    
});
