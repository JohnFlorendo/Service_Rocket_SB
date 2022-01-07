/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/url', '../Library/lcc_lib_payroll'],
    function(search, record, runtime, url,libHelper) {
        var currentScript = runtime.getCurrentScript();

        function getInputData() {
            var objParameterData = JSON.parse(currentScript.getParameter({ name: 'custscript_paycycleid' }));

            var arrData = [];
            if(objParameterData.recordid) {
                var arrEmployees = [];
                var recPayCycle = record.load({type: "customrecord_sr_pay_cycle", id: objParameterData.recordid, isDynamic: true });
                for(var intIndex=0; intIndex<recPayCycle.getLineCount('recmachcustrecord_sr_pc_pay_cycle_header'); intIndex++) {
                    arrEmployees.push(recPayCycle.getSublistValue({ sublistId: 'recmachcustrecord_sr_pc_pay_cycle_header', fieldId: 'custrecord_sr_pc_emp_employee', line: intIndex }));
                }

                if(objParameterData.recordtype == "expensereport") {
                    //arrData = libHelper.getEmployeeExpenseReports(arrEmployees, recPayCycle.getText('custrecord_sr_pc_start_date'), recPayCycle.getText('custrecord_sr_pc_end_date'));
                    arrData = libHelper.getEmployeeExpenseReportsPerPayCycle(recPayCycle.id);
                } else if(objParameterData.recordtype== "commission") {
                    arrData = libHelper.getEmployeeCommissions(arrEmployees, recPayCycle.getText('custrecord_sr_pc_start_date'), recPayCycle.getText('custrecord_sr_pc_end_date'));
                } else {
                    arrData = libHelper.getEmployeeBonuses(arrEmployees, recPayCycle.getText('custrecord_sr_pc_start_date'), recPayCycle.getText('custrecord_sr_pc_end_date'));
                }
            }

            return arrData;
        }

        function map(context) {
            try {
                var resultValue = JSON.parse(context.value);
                if(resultValue.recordtype == "expensereport") {
                    processExpenseReport(resultValue);
                } else if(resultValue.recordtype == "commission") {
                    processCommission(resultValue);
                } else {
                    processBonus(resultValue);
                }

            } catch(e) { log.debug('ERROR', e); }
        }

        function processExpenseReport(resultValue) {
            if(resultValue.status != "paidInFull") {
                var stPettyCashAccounts = currentScript.getParameter({name: 'custscript_param_petty_account_per_loc'});
                var objPettyCashAccounts = (stPettyCashAccounts) ? JSON.parse(stPettyCashAccounts) : {};

                /** GET CREDIT ACCOUNT **/
                    // var recVendorPayment = record.create({
                    //     type: record.Type.VENDOR_PAYMENT,
                    //     isDynamic: false,
                    //     defaultValues: {
                    //         apacct: resultValue.accountid,
                    //         entity: resultValue.entityid,
                    //         subsidiary: resultValue.subsidiary
                    //     }
                    // });
                    // var intCreditAccount = recVendorPayment.getValue('account');
                var intCreditAccount = objPettyCashAccounts[resultValue.location];
                var intPayOffId = createPayoffRecord(resultValue, intCreditAccount);

                if(intPayOffId != null) {
                    var recVendorPayment = record.create({
                        type: record.Type.VENDOR_PAYMENT,
                        isDynamic: false,
                        defaultValues: {
                            apacct: resultValue.accountid,
                            entity: resultValue.entityid,
                            subsidiary: resultValue.subsidiary
                        }
                    });

                    var intPayOffLineNumber = recVendorPayment.findSublistLineWithValue({ sublistId: "apply", fieldId: 'internalid', value: intPayOffId.toString() });
                    if(intPayOffLineNumber != -1) {
                        recVendorPayment.setSublistValue({
                            sublistId: "apply",
                            fieldId: "apply",
                            value: true,
                            line: intPayOffLineNumber
                        });
                    }

                    var intExpenseReportLineNumber = recVendorPayment.findSublistLineWithValue({ sublistId: "apply", fieldId: 'internalid', value: resultValue.recordid });
                    if(intExpenseReportLineNumber != -1) {
                        recVendorPayment.setSublistValue({
                            sublistId: "apply",
                            fieldId: "apply",
                            value: true,
                            line: intExpenseReportLineNumber
                        });
                    }

                    var intVendorPaymentId = recVendorPayment.save(true, true);
                    log.debug('intVendorPaymentId', intVendorPaymentId);
                }
            }
        }

        function processCommission(resultValue) {
            if(resultValue.status != "paidInFull") {
                /** GET CREDIT ACCOUNT **/
                var recVendorPayment = record.create({
                    type: record.Type.VENDOR_PAYMENT,
                    isDynamic: false,
                    defaultValues: {
                        apacct: resultValue.accountid,
                        entity: resultValue.entityid,
                        subsidiary: resultValue.subsidiary
                    }
                });
                var intCreditAccount = recVendorPayment.getValue('account');
                var intPayOffId = createPayoffRecord(resultValue, intCreditAccount);

                if(intPayOffId != null) {
                    var recVendorPayment = record.create({
                        type: record.Type.VENDOR_PAYMENT,
                        isDynamic: false,
                        defaultValues: {
                            apacct: resultValue.accountid,
                            entity: resultValue.entityid,
                            subsidiary: resultValue.subsidiary
                        }
                    });

                    var intPayOffLineNumber = recVendorPayment.findSublistLineWithValue({ sublistId: "apply", fieldId: 'internalid', value: intPayOffId.toString() });
                    if(intPayOffLineNumber != -1) {
                        recVendorPayment.setSublistValue({
                            sublistId: "apply",
                            fieldId: "apply",
                            value: true,
                            line: intPayOffLineNumber
                        });
                    }

                    var intExpenseReportLineNumber = recVendorPayment.findSublistLineWithValue({ sublistId: "apply", fieldId: 'internalid', value: resultValue.recordid });
                    if(intExpenseReportLineNumber != -1) {
                        recVendorPayment.setSublistValue({
                            sublistId: "apply",
                            fieldId: "apply",
                            value: true,
                            line: intExpenseReportLineNumber
                        });
                    }

                    var intVendorPaymentId = recVendorPayment.save(true, true);
                    log.debug('intVendorPaymentId', intVendorPaymentId);
                }
            }
        }

        function processBonus(resultValue) {
            record.submitFields({
                type: "bonus",
                id: resultValue.bonusid,
                values: { bonusstatus: "paid" }
            });
        }

        function createPayoffRecord(objData, intCreditAccount) {
            try {
                var recPayOff = record.create({ type:"customtransaction_sr_pay_cycle", isDynamic: true });
                recPayOff.setValue('subsidiary', objData.subsidiary);
                recPayOff.setValue('currency', objData.currency);
                recPayOff.setValue('memo', objData.memo);
                recPayOff.setValue('transtatus', "B");
                recPayOff.setValue('custbody_linked_transaction', objData.recordid);

                var currLineDebit = recPayOff.selectNewLine({ sublistId: "line" });
                currLineDebit.setCurrentSublistValue({ sublistId: 'line', fieldId: 'entity', value: objData.entityid });
                currLineDebit.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: objData.accountid });
                currLineDebit.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: objData.fxamount });
                currLineDebit.commitLine({ sublistId: 'line' });

                var currLineCredit = recPayOff.selectNewLine({ sublistId: "line" });
                currLineCredit.setCurrentSublistValue({ sublistId: 'line', fieldId: 'entity', value: objData.entityid });
                currLineCredit.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: intCreditAccount });
                currLineCredit.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: objData.fxamount });
                currLineCredit.commitLine({ sublistId: 'line' });

                return recPayOff.save();
            } catch(e) { log.debug('ERROR', e); }
        }


        return {
            getInputData : getInputData,
            map : map
        };
    });