/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/task', 'N/file', 'N/error', 'N/runtime'],
		/**
		 * @param{task} task
		 * @param{url} url
		 */
		function(task, file, error, runtime) {
			function beforeLoad(scriptContext) {
				try {
					const ADMINISTRATOR = 3;
					//added by Patrick Alcomendas to handle error
					if (scriptContext.request == undefined) {
						return;
					}

					/*if (runtime.getCurrentUser().role != ADMINISTRATOR) {
						var sublist = scriptContext.form.getSublist({id: 'timeitem'});
						sublist && sublist.getField({id: 'item'}).updateDisplayType({displayType: 'hidden'});
					}*/

					if (scriptContext.request.parameters.approved == 'T') {
						var newRecord = scriptContext.newRecord;
						var stErrorMessage = 'Timesheet partially approved.\n';

						for (var intIndex = 0; intIndex < newRecord.getLineCount('timeitem'); intIndex++) {
							var stCustomer = newRecord.getSublistValue({sublistId: 'timeitem', fieldId: 'customer', line: intIndex});

							if (stCustomer != '') {
								var chkBillable = newRecord.getSublistValue({sublistId: 'timeitem', fieldId: 'isbillable', line: intIndex});
								var chkIsLearning = newRecord.getSublistValue({sublistId: 'timeitem', fieldId: 'custcol_sr_is_learning', line: intIndex});
								var chkIsOnBoarding = newRecord.getSublistValue({sublistId: 'timeitem', fieldId: 'custcol_sr_is_onboarding', line: intIndex});
								var chkIsPMO = newRecord.getSublistValue({sublistId: 'timeitem', fieldId: 'custcol_sr_is_pmo', line: intIndex});
								var stReason = newRecord.getSublistValue({sublistId: 'timeitem', fieldId: 'custcol_write_off_approval', line: intIndex});
								var stItem = newRecord.getSublistText({sublistId: 'timeitem', fieldId: 'item', line: intIndex});
								var hasScoping = /Scoping/.test(stItem);

								if (chkBillable == false && chkIsLearning == false && chkIsOnBoarding == false && chkIsPMO == false && stReason == '' && hasScoping == false) {
									stErrorMessage += 'Please provide a Write Off Reason for non-billable entries for customer projects for line ' + parseInt(parseInt(intIndex) + 1) + '\n';
								}
							}

						}

						if (stErrorMessage != 'Timesheet partially approved.\n') {
							throw stErrorMessage;
						}
					}
				}
				catch (e) {
					log.error('Error::beforeload', e);
				}
			}

			function beforeSubmit(scriptContext) {
				var newRecord = scriptContext.newRecord;
				//if(scriptContext.type == 'approve') {

				//}

			}

			return {beforeSubmit: beforeSubmit, beforeLoad: beforeLoad};

		});
