/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/render','N/file','N/search'],
    function(record, render,file,search,url) {

        function onRequest(context) {
            if (context.request.method === 'GET') {
                var intTranId = context.request.parameters.tranid;
                if(intTranId){
                    var xmlStr = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
                    xmlStr += '<pdfset>';
                    xmlStr += renderTrans(intTranId);
                    xmlStr += '</pdfset>';
                    context.response.renderPdf({ xmlString: xmlStr });
                }
            }
        }

        function renderTrans(tranid) {

            //var tmpPage2 = file.load({id : '../Template/service_rocket_estimate_2.html'});

            var recOppurtunity = record.load({
                type: record.Type.ESTIMATE,
                id: tranid
            });

            var tmpPage1 = '';

            if(recOppurtunity.getValue('custbody_quote_type') == 1 || recOppurtunity.getValue('custbody_quote_type') == 3){
                tmpPage1 = file.load({id : '../Template/service_rocket_estimate_1.html'});
                //tmpPage1 = file.load({id : 63630});
            }else{
                tmpPage1 = file.load({id : '../Template/service_rocket_statementofwork2.html'});
            }
            var recSubsidiary = record.load({
                type: record.Type.SUBSIDIARY,
                id: recOppurtunity.getValue({
                    fieldId: 'subsidiary'
                })
            });

            var renderer = render.create();
            renderer.templateContent = tmpPage1.getContents();
            //renderer.templateContent += tmpPage2.getContents();
            /*if(arrCharges.length > 0){
                renderer.templateContent += tmpPage2.getContents();
                var stHTML = buildChargeTable(arrCharges);
                var stTotalHour = getTotal(arrCharges).totalHour;
                var stTotalAmount = getTotal(arrCharges).totalAmount;
              FF
                renderer.templateContent = renderer.templateContent.replace('{totalHours}',stTotalHour);
                renderer.templateContent = renderer.templateContent.replace('{totalAmount}',numberWithCommas(stTotalAmount.toFixed(2)));

            }*/
            renderer.addRecord('record',recOppurtunity);
            renderer.addRecord('subsidiary',recSubsidiary);
            // log.debug('renderer.templateContent',renderer.templateContent);

            return renderer.renderAsString();
        }

        function  buildChargeTable(arrCharges) {

            var totalHour = 0;
            var totalAmount = 0;
            var htmlTable = '';
            htmlTable += '<table style="width: 100%; margin-top: 10px; margin-left: 0.4in; margin-right: 0.4in; font-size: 11pt; border-collapse: collapse; font-size: 11px;">';
            htmlTable += '<tr style="background-color: #F5F5F5; color: #AAAAAA; font-weight: bold; font-size: 11px;">';
            htmlTable += '    <td width="10%" >Date</td>';
            htmlTable += '    <td width="10%" >Employee</td>';
            htmlTable += '    <td width="10%" >Item</td>';
            htmlTable += '    <td width="45%" >Memo</td>';
            htmlTable += '    <td align="right" width="5%" >Time</td>';
            htmlTable += '    <td align="right" width="10%" >Rate</td>';
            htmlTable += '    <td align="right" width="10%" >Amount</td>';
            htmlTable += '</tr>';

            var count = 0;
            var page = false;
            var pagecount = 0;
            var totalpage = 0;
            for(var indx = 0; indx < arrCharges.length; indx++){

                if(pagecount == 0){
                    if(count == 10){
                        page = true;
                        count = 0;
                        pagecount++;
                    }
                }else{
                    if(count == 15){
                        page = true;
                        count = 0;
                        pagecount++;
                    }
                }

                if(page){
                    htmlTable += '<tr style="border-bottom: 0.10px solid #AAAAAA; line-height:200%; margin-top: 0.5in;">';
                    page = false;
                }else {
                    htmlTable += '<tr style="border-bottom: 0.10px solid #AAAAAA; line-height:200%; ">';
                }

                htmlTable += '    <td align="left" style="white-space: nowrap">' + arrCharges[indx].date +'</td>';
                htmlTable += '    <td align="left" style="white-space: nowrap">' + arrCharges[indx].employee +'</td>';
                htmlTable += '    <td align="left" >' + arrCharges[indx].item +'</td>';
                htmlTable += '    <td align="left">' + arrCharges[indx].memo +'</td>';
                htmlTable += '    <td align="right">' + arrCharges[indx].time +'</td>';
                htmlTable += '    <td align="right">' + arrCharges[indx].rate +'</td>';
                htmlTable += '    <td align="right">' + arrCharges[indx].amount +'</td>';
                htmlTable += '</tr>';

                totalHour += Number(arrCharges[indx].time);
                totalAmount += Number(arrCharges[indx].amount);

                count++;
                totalpage++;
            }

            htmlTable += '<tr style="font-size: 12pt">';
            htmlTable += '    <td></td>';
            htmlTable += '    <td></td>';
            htmlTable += '    <td></td>';
            htmlTable += '    <td align="right">Total</td>';
            htmlTable += '    <td align="right">' + totalHour+'</td>';
            htmlTable += '    <td align="right" colspan="2">' + numberWithCommas(totalAmount.toFixed(2)) +'</td>';
            htmlTable += '</tr>';


            htmlTable += '</table>';

            return htmlTable;

        }

        function numberWithCommas(number) {
            return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        function  getTotal(arrCharges) {
            var objResults = {};
            objResults.totalHour = 0;
            objResults.totalAmount = 0;
            for(var indx = 0; indx < arrCharges.length; indx++){
                objResults.totalHour += Number(arrCharges[indx].time);
                objResults.totalAmount += Number(arrCharges[indx].amount);
            }
            return objResults;
        }


        function getCharges(stProject,stInvoice) {
            if(stProject){
                var arrCharges = [];
                var chargeSearchObj = search.create({
                    type: "charge",
                    filters:
                        [
                            ["job.internalid","anyof",stProject],
                            "AND",
                            ["use","anyof","Actual"],
                            "AND" ,
                            ["invoice.internalid","anyof",stInvoice]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "use",
                                sort: search.Sort.ASC,
                                label: "Charge Use"
                            }),
                            search.createColumn({name: "chargetype", label: "Charge Type"}),
                            search.createColumn({name: "id", label: "Charge ID"}),
                            search.createColumn({name: "billto", label: "Customer:Project"}),
                            search.createColumn({name: "rate", label: "Rate"}),
                            search.createColumn({name: "quantity", label: "Quantity"}),
                            search.createColumn({name: "amount", label: "Amount"}),
                            search.createColumn({name: "chargedate", label: "Date"}),
                            search.createColumn({name: "billdate", label: "Bill Date"}),
                            search.createColumn({name: "servicestartdate", label: "Service Start Date"}),
                            search.createColumn({name: "serviceenddate", label: "Service End Date"}),
                            search.createColumn({name: "modifieddate", label: "Date Modified"}),
                            search.createColumn({name: "salesorder", label: "Sales Order Id"}),
                            search.createColumn({name: "stage", label: "Charge Stage"}),
                            search.createColumn({name: "runid", label: "Charge Run ID"}),
                            search.createColumn({name: "postingperiod", label: "Posting Period"}),
                            search.createColumn({name: "billingschedule", label: "Billing Schedule"}),
                            search.createColumn({name: "billingmode", label: "Billing Mode"}),
                            search.createColumn({name: "description", label: "Description"}),
                            search.createColumn({name: "memo", label: "Memo"}),
                            search.createColumn({name: "grouporder", label: "Group Order"}),
                            search.createColumn({name: "chargeemployee", label: "Employee"}),
                            search.createColumn({name: "billingitem", label: "Item"}),
                            search.createColumn({
                                name: "durationdecimal",
                                join: "time",
                                label: "Duration (Decimal)"
                            }),
                            search.createColumn({
                                name: "displayname",
                                join: "item",
                                label: "Display Name"
                            }),
                            search.createColumn({
                                name: "firstname",
                                join: "chargeEmployee",
                                label: "First Name"
                            }),
                            search.createColumn({
                                name: "lastname",
                                join: "chargeEmployee",
                                label: "Last Name"
                            })

                        ]
                });
                var searchResultCount = chargeSearchObj.runPaged().count;
                log.debug("chargeSearchObj result count",searchResultCount);
                chargeSearchObj.run().each(function(result){
                    var stDisplay = result.getValue({
                        name: 'displayname',
                        join: 'item'
                    });
                    var stEmpFname = result.getValue({
                        name: 'firstname',
                        join: 'chargeEmployee'
                    });
                    var stEmpLname = result.getValue({
                        name: 'lastname',
                        join: 'chargeEmployee'
                    });

                    var stEmployee=  stEmpFname + '<br/>' + stEmpLname;

                    var itemName = (stDisplay != '')? stDisplay : result.getText('billingitem');
                    var objCharge = {};
                    objCharge.customer = result.getText('billto');
                    objCharge.date = result.getValue('billdate');
                    objCharge.employee = stEmployee; //result.getValue('chargeemployee');
                    objCharge.item = itemName;
                    objCharge.memo = result.getValue('memo');
                    objCharge.rate = result.getValue('rate');
                    objCharge.amount = result.getValue('amount');
                    objCharge.time = result.getValue({
                        name: 'durationdecimal',
                        join: 'time'
                    });

                    arrCharges.push(objCharge);
                    return true;
                });

                return arrCharges;
            }
        }

        return {
            onRequest: onRequest
        };

    });
