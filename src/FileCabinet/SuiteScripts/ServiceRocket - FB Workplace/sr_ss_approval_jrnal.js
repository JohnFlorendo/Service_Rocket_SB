/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define([ 'N/search', 'N/record', 'N/log' ,'N/runtime','N/email','./Library/sr_post_helper.js'],

		function(search, record, log , runtime ,email,libHelper) {

	/**
	 * Definition of the Scheduled script trigger point.
	 *
	 * @param {Object} scriptContext
	 * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
	 * @Since 2015.2
	 */
	var departmentD;
    var classD;
    var locationD;
	/*getting statusText for lease version posting it will be a static text 'LVPost' and also the lease ID 
    and for payment Schedule we need to give value of Schelected Schedule from the batch record and also the leaseId and start and end Dates.*/

	function execute(scriptContext) {
		var recordId =  runtime.getCurrentScript().getParameter({name: 'custscript_record_id'});
		var accountCr =  runtime.getCurrentScript().getParameter({name: 'custscript_project_var_act'});
		try{
			var objApprover = record.load({type: 'timebill', id: recordId});
			var empName =  objApprover.getValue('employee');
	        var custName =  objApprover.getValue('customer');
	        var jrnalMemo =  objApprover.getValue('memo');
	        var hours =  objApprover.getValue('hours');
	        log.debug('Time sheet enterted for - ',recordId)
           // hours = ''+hours.split(':')[0]+'.'+hours.split(':')[1]+''
           var timebillCheck = search.lookupFields({             
                type:'timebill',
                id: recordId,
                columns: ['isbillable']
            });
            var billCbk = timebillCheck['isbillable'];

            var transactionCheck = search.lookupFields({             
                type:'employee',
                id: empName,
                columns: ['subsidiary','department','class','location','custentity_laborcost_usd']
            });
            var subsidaryD = transactionCheck['subsidiary'][0].value;
            var subsidaryText = transactionCheck['subsidiary'][0].text;
            try{
            	departmentD = transactionCheck['department'][0].value;
	            classD = transactionCheck['class'][0].value;
	            locationD = transactionCheck['location'][0].value;
            }catch(e){
            	log.debug('Record doesnt have',e)
            }
            var labourCost = transactionCheck['custentity_laborcost_usd'];
            var finalAmount = (Number(Number(hours)*Number(labourCost))).toFixed(2);
            var finalLineMemo = 'Time Entry for '+subsidaryText+'; memo:'+jrnalMemo+'';
            var jobCheck = search.lookupFields({             
                type:'job',
                id: custName,
                columns: ['currency','projectexpensetype']
            });
            var lvCurrency = jobCheck['currency'][0].value;
            var accountDr = jobCheck['projectexpensetype'][0].value;
            libHelper.CreateJournal(subsidaryD,classD,departmentD,locationD,lvCurrency,recordId,finalLineMemo,accountDr,finalAmount,accountCr,billCbk);
		}catch(e){
			log.debug('Error',e)
		}
	}
	return {
		execute: execute
	};

});