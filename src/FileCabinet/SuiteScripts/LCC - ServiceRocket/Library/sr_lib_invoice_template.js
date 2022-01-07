define(['N/record', 'N/render','N/file','N/search','N/xml','N/currency'],

    function(record, render,file,search,xml,currency) {
        var libFunction = {};
        const ServiceRocket_India_Private_Ltd = 15;

        libFunction.generatePDF = function (inTranId,folderId) {
            try{
                var xmlStr = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
                xmlStr += '<pdfset>';
                xmlStr += renderTrans(inTranId);
                xmlStr += '</pdfset>';

                if(folderId){
                    downloadPDF(inTranId,xmlStr,folderId);
                }

                return xmlStr;

            }catch (e) {
                log.debug('generatePDF',e);
            }
        }

        // libFunction.searchAllInvoices = function () {
        //     var arrInvoices = [];
        //     try{
        //         var invoiceSearchObj = search.create({
        //             type: search.Type.INVOICE,
        //             filters:
        //                 [
        //                     ["type","anyof","CustInvc"],
        //                     "AND",
        //                     ["status","anyof","CustInvc:A"],
        //                     "AND",
        //                     ["mainline","is","T"],
        //                     // "AND",
        //                     // ["internalid","anyof",['1587895','1586251','1585707']]
        //                 ],
        //             columns:
        //                 [
        //                     "entity"
        //                 ]
        //         });
        //
        //         var myPagedData = invoiceSearchObj.runPaged({
        //             pageSize: 1000
        //         });
        //
        //         try {
        //             myPagedData.pageRanges.forEach(function(pageRange) {
        //                 var myPage = myPagedData.fetch({
        //                     index: pageRange.index
        //                 });
        //                 myPage.data.forEach(function(result) {
        //                     var tranId = result.id;
        //                     var entityId = result.getValue('entity');
        //                     arrInvoices.push({
        //                         id : tranId,
        //                         entityId : entityId
        //                     });
        //                 });
        //             });
        //         } catch (e) {
        //             log.debug(e);
        //         }
        //     }catch (e) {
        //
        //     }
        //
        //     return arrInvoices;
        // }

        libFunction.searchAllInvoices = function (paramSearchId) {
            var arrInvoices = [];
            try{
                var invoiceSearchObj = search.load({
                    id: paramSearchId
                });

                var myPagedData = invoiceSearchObj.runPaged({
                    pageSize: 1000
                });

                try {
                    myPagedData.pageRanges.forEach(function(pageRange) {
                        var myPage = myPagedData.fetch({
                            index: pageRange.index
                        });
                        myPage.data.forEach(function(result) {
                            var tranId = result.id;
                            var entityId = result.getValue('entity');
                            arrInvoices.push({
                                id : tranId,
                                entityId : entityId
                            });
                        });
                    });
                } catch (e) {
                    log.debug(e);
                }
            }catch (e) {

            }

            return arrInvoices;
        }

        function downloadPDF(inTranId, xmlStr, folderId) {
            var isDownload = false;
            try{
                var fileName = createFileName(inTranId);
                log.debug('fileName', fileName);

                var fileId = createInvoicePDF(fileName, xmlStr, folderId);

                updateInvoiceField(fileId, inTranId);
            }catch (e) {
                log.debug('downloadPDF',e);
            }

            return isDownload
        }

        function createFileName(inTranId) {
            var recInvoice = record.load({
                type: record.Type.INVOICE,
                id: inTranId
            });
            var fileName = 'invoice_'+ recInvoice.getValue('tranid') + '.pdf';

            return fileName;
        }

        function createInvoicePDF(fileName, xmlStr, folderId) {
            try {
                var renderer = render.create();
                renderer.templateContent = xmlStr;

                var invoicePdf = renderer.renderAsPdf();

                var fileObj = file.create({
                    name: fileName,
                    fileType: file.Type.PDF,
                    contents : invoicePdf.getContents()
                });

                log.debug('folderId', folderId);
                fileObj.folder = folderId;

                var fileId = fileObj.save();
                log.debug('Downloaded File',fileId);
            } catch (e) {
                log.debug('createInvoicePDF -> error', e);
            }

            return fileId;
        }

        function updateInvoiceField(fileId, inTranId) {
            if(fileId){
                //UPDATE YP PDF
                record.submitFields({
                    type : 'invoice',
                    id : inTranId,
                    values : {
                        custbody_yp_pdf : fileId
                    }
                })
            }
        }

        function renderTrans(inInvoiceId) {
            var xmlContent = '';
            try{
                var recInvoice = record.load({
                    type: record.Type.INVOICE,
                    id: inInvoiceId
                });

                var objInvoiceData = invoiceData(recInvoice);

                var recSubsidiary = record.load({
                    type: record.Type.SUBSIDIARY,
                    id: objInvoiceData.invoiceFields.subsidiary
                });

                var renderer = createRender(objInvoiceData);

                invoiceTemplatePage2(renderer, objInvoiceData);

                renderer.addRecord('record',recInvoice);
                renderer.addRecord('subsidiary',recSubsidiary);

                xmlContent = escapeRegExp(renderer.renderAsString());
            }catch (e) {
                log.debug('renderTrans=>error',e);
            }

            return xmlContent;
        }

        function getInvoiceFields(recInvoice) {
            var objInvoiceFields = {};

            var inProject = recInvoice.getValue({
                fieldId: 'job'
            });

            var inSubsidiary = recInvoice.getValue({
                fieldId: 'subsidiary'
            });

            var inSubTotal = recInvoice.getValue({
                fieldId : 'subtotal'
            });

            objInvoiceFields.project = inProject;
            objInvoiceFields.subsidiary = inSubsidiary;
            objInvoiceFields.subTotal = inSubTotal;

            return objInvoiceFields;
        }

        function lookUpProjectField(inProject, inInvoiceId) {
            var arrCharges = [];

            if(inProject){
                var fieldLookUp = search.lookupFields({
                    type: search.Type.JOB,
                    id: inProject,
                    columns: ['custentity_sr_charge_details']
                });

                //CHECK IF INCLUDE DETAILS
                if(fieldLookUp.custentity_sr_charge_details){
                    arrCharges = getCharges(inProject, inInvoiceId);
                }
            }

            return arrCharges;
        }

        function exchangeRate(inSubsidiary) {
            var rate = 1;
            if(inSubsidiary == ServiceRocket_India_Private_Ltd){
                rate = currency.exchangeRate({
                    source: 'USD',
                    target: 'INR'
                });
            }

            return rate;
        }

        function invoiceData(recInvoice) {
            return {
                invoiceId : recInvoice.id,
                tmpPage1 : file.load({id : '../Template/service_rocket_invoice_1.html'}),
                tmpPage2 : file.load({id : '../Template/service_rocket_invoice_2.html'}),
                invoiceFields : getInvoiceFields(recInvoice),
                exchangeRate : exchangeRate(getInvoiceFields(recInvoice).subsidiary),
                page1Content : invoiceContentPage1(recInvoice),
                amountInWords : amountInWords(exchangeRate(getInvoiceFields(recInvoice).subsidiary), getInvoiceFields(recInvoice).subTotal),
                projectFields : lookUpProjectField(getInvoiceFields(recInvoice).project, recInvoice.id),
            };
        }

        function amountInWords(rate, inSubTotal) {
            var objAmountInWords = {};

            if (rate != 1) {
                var changedTotal = (inSubTotal/rate).toFixed(2);
                var splittedNumRS = inSubTotal.toString().split('.');
                var splittedNumUS = changedTotal.toString().split('.');
                var nonDecimal = splittedNumRS[0];
                var decimal = splittedNumRS[1];

                if (decimal == undefined || decimal == 'undefined') {
                    var stAmount = price_in_words(Number(nonDecimal)) +"Only";
                } else {
                    var stAmount = price_in_words(Number(nonDecimal))+" and "+price_in_words(decimal)+" paise Only";
                }

                var nonDecimalUs = splittedNumUS[0];
                var decimalUS = splittedNumUS[1];

                if (decimalUS == undefined || decimalUS == 'undefined') {
                    var stAmountUS = price_in_words(Number(nonDecimalUs)) +"Only";
                } else {
                    var stAmountUS = price_in_words(Number(nonDecimalUs))+" And Cents "+price_in_words(decimalUS)+"Only";
                }
            }

            objAmountInWords.stAmount = stAmount;
            objAmountInWords.stAmountUS = stAmountUS;
            objAmountInWords.changedTotal = changedTotal;

            return objAmountInWords;
        }

        function createRender(invoiceData) {
            var objPageContent = invoiceData.page1Content;

            var objAmountInWords = invoiceData.amountInWords;

            var tmpPage1 = invoiceData.tmpPage1;

            var renderer = render.create();
            renderer.templateContent = tmpPage1.getContents();

            if(invoiceData.exchangeRate != 1){
                renderer.templateContent = renderer.templateContent.replace('{changedTotal}',objAmountInWords.changedTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                renderer.templateContent = renderer.templateContent.replace('{usdExchangeRate}',invoiceData.exchangeRate);
                renderer.templateContent = renderer.templateContent.replace('{changedTotalSub}',objAmountInWords.changedTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                renderer.templateContent = renderer.templateContent.replace('{changedTotalSubMain}',objAmountInWords.changedTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                renderer.templateContent = renderer.templateContent.replace('{wordUS}',objAmountInWords.stAmountUS);
                renderer.templateContent = renderer.templateContent.replace('{wordRS}',objAmountInWords.stAmount);
            }
            renderer.templateContent = renderer.templateContent.replace('{stDuration}',objPageContent.stDuration);
            renderer.templateContent = renderer.templateContent.replace('{stSublistHTML}',objPageContent.stSublistHTML);
            renderer.templateContent = renderer.templateContent.replace('{stTaxGroupDescription}',objPageContent.stTaxCode);

            return renderer;
        }

        function invoiceContentPage1(recInvoice) {
            var objContent = {};
            //REPLACE THE LINE ITEM IN PAGE 1
            var stDuration = getReportDuration(recInvoice);
            // var stSublistHTML = buildItemSublist(recInvoice);
            var stSublistHTML = buildItemSublistByType(recInvoice);
            var stTaxCode = getTaxCodeDescription(recInvoice);

            objContent['stDuration'] = stDuration;
            objContent['stSublistHTML'] = stSublistHTML;
            objContent['stTaxCode'] = stTaxCode;

            return objContent;
        }

        function invoiceTemplatePage2(renderer, invoiceData) {
            var arrCharges = invoiceData.projectFields;
            var tmpPage2 = invoiceData.tmpPage2;
            var objPageContent = invoiceData.page1Content;

            if(arrCharges.length > 0){
                renderer.templateContent += tmpPage2.getContents();
                var stHTML = buildChargeTable(arrCharges);
                var stTotalHour = getTotal(arrCharges).totalHour;
                var stTotalAmount = getTotal(arrCharges).totalAmount;
                renderer.templateContent = renderer.templateContent.replace('{stDuration}',objPageContent.stDuration);
                renderer.templateContent = renderer.templateContent.replace('{arrCharges}',stHTML);
                renderer.templateContent = renderer.templateContent.replace('{totalHours}',stTotalHour);
                renderer.templateContent = renderer.templateContent.replace('{totalAmount}',numberWithCommas(stTotalAmount.toFixed(2)));
            }
        }

        function buildChargeTable(arrCharges) {

            var totalHour = 0;
            var totalAmount = 0;
            var htmlTable = '';
            htmlTable += '<table style="width: 100%; margin-top: 10px; margin-left: 0.4in; margin-right: 0.4in; font-size: 11pt; border-collapse: collapse; font-size: 11px;">';
            htmlTable += '<tr style="background-color: #F5F5F5; color: #AAAAAA; font-weight: bold; font-size: 11px;">';
            htmlTable += '    <td width="10%" >Date</td>';
            htmlTable += '    <td width="13%" >Employee</td>';
            htmlTable += '    <td width="27%" >Item</td>';
            htmlTable += '    <td width="29%" >Memo</td>';
            htmlTable += '    <td align="right" width="5%" >Time</td>';
            htmlTable += '    <td align="right" width="8%" >Rate</td>';
            htmlTable += '    <td align="right" width="8%" >Amount</td>';
            htmlTable += '</tr>';

            var count = 0;
            var page = false;
            var pagecount = 0;
            var totalpage = 0;
            for(var indx = 0; indx < arrCharges.length; indx++){

                if(pagecount == 0){
                    if(count == 11){
                        page = true;
                        count = 0;
                        pagecount++;
                    }
                }else{
                    if(count == 16){
                        page = true;
                        count = 0;
                        pagecount++;
                    }
                }

                if(page){
                    htmlTable += '<tr style="border-bottom: 0.10px solid #AAAAAA; line-height:200%; padding-top:6px;" >';
                    page = false;
                }else {
                    htmlTable += '<tr style="border-bottom: 0.10px solid #AAAAAA; line-height:200%; ">';
                }

                htmlTable += '    <td align="left" style="white-space: nowrap">' + arrCharges[indx].date +'</td>';
                htmlTable += '    <td align="left" style="white-space: nowrap">' + arrCharges[indx].employee +'</td>';
                htmlTable += '    <td align="left" style="white-space: nowrap">' + arrCharges[indx].item +'</td>';
                htmlTable += '    <td align="left" style="line-height: normal; padding-top: 8px; padding-left: 7px">' + arrCharges[indx].memo +'</td>';
                htmlTable += '    <td align="right">' + arrCharges[indx].time +'</td>';
                htmlTable += '    <td align="right">' + numberWithCommas(arrCharges[indx].rate) +'</td>';
                htmlTable += '    <td align="right">' + numberWithCommas(arrCharges[indx].amount) +'</td>';
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

        function  buildItemSublistByType(recInvoice) {
            var objSublistItems = {};
            var stHTML = '';
            var inSubsidiary = recInvoice.getValue('subsidiary');
            var rate = exchangeRate(inSubsidiary);
            var intLine = recInvoice.getLineCount('item');

            var hasDiscount = false;
            for(var indxLine = 0; indxLine < intLine; indxLine++){
                var objSublist = sublistData(recInvoice, indxLine);

                if(objSublist.grossAmount){
                    if(objSublist.itemType == 'Discount'){
                        hasDiscount = true;
                    }
                }

                if(objSublistItems[indxLine] == null){
                    objSublistItems[indxLine] = {
                        'name' : objSublist.itemName,
                        'description' : objSublist.description,
                        'quantity' : objSublist.qty,
                        'tax' : objSublist.taxAmount,
                        'rate' : objSublist.rate,
                        'amount' : (objSublist.amount/rate).toFixed(3),
                        'gross_amount' : (objSublist.grossAmount/rate).toFixed(3)
                    }
                }
            }

            if(hasDiscount){
                stHTML += buildRowsForDiscount(objSublistItems, inSubsidiary);
            }else{
                stHTML += buildRowsForNonDiscount(objSublistItems, inSubsidiary);
            }

            return stHTML;
        }

        function sublistData(recInvoice, indxLine) {
            return {
                itemType : recInvoice.getSublistValue('item','itemtype',indxLine),
                itemName : recInvoice.getSublistText('item','item',indxLine),
                description : recInvoice.getSublistText('item','description',indxLine),
                qty : recInvoice.getSublistValue('item','quantity',indxLine),
                rate : recInvoice.getSublistValue('item','rate',indxLine),
                taxAmount : (recInvoice.getSublistValue('item','tax1amt',indxLine)) ? recInvoice.getSublistValue('item','tax1amt',indxLine) : 0,
                amount : recInvoice.getSublistValue('item','amount',indxLine),
                grossAmount : recInvoice.getSublistValue('item','grossamt',indxLine),
            };
        }

        function buildRowsForNonDiscount(objSublistItems,stSubsidiary) {

            var stHTMLRows = ''
            var count = 1;
            var totalDiscountLength = 0;
            // log.debug('buildRowsForNonDiscount=>objSublistItems',objSublistItems);
            for (var item in objSublistItems){
                totalDiscountLength += objSublistItems[item].description.length;
                var stDescription = objSublistItems[item].description;
                stDescription = stDescription.replace(/\n/g, " <br/>");

                var qty =  Number(objSublistItems[item].quantity).toFixed(2);
                var rate = Number(objSublistItems[item].rate).toFixed(2);
                var tax = Number(objSublistItems[item].tax).toFixed(2);
                var amount = Number(objSublistItems[item].amount).toFixed(2);

                if(totalDiscountLength < 400){
                    stHTMLRows += '<tr style="margin-top: 0.2in">';
                    stHTMLRows += '<td>'+count+'</td>';
                    stHTMLRows += '<td> <p style="text-align: left">'+stDescription+'</p></td>';
                    stHTMLRows += '<td align="right">'+numberWithCommas(qty)+'</td>';
                    stHTMLRows += '<td align="right">'+numberWithCommas(rate)+'</td>';
                    if(stSubsidiary != 8){
                        stHTMLRows += '<td align="right">'+numberWithCommas(tax)+'</td>';
                    }

                    stHTMLRows += '<td align="right">'+numberWithCommas(amount)+'</td>';
                    stHTMLRows += '</tr>';
                }else {
                    stHTMLRows += '<tr style="margin-top: 0.2in">';
                    stHTMLRows += '<td>'+count+'</td>';
                    stHTMLRows += '<td> <p style="text-align: left">'+stDescription+'</p></td>';
                    stHTMLRows += '<td align="right">'+numberWithCommas(qty)+'</td>';
                    stHTMLRows += '<td align="right">'+numberWithCommas(rate)+'</td>';
                    if(stSubsidiary != 8) {
                        stHTMLRows += '<td align="right">' + numberWithCommas(tax) + '</td>';
                    }
                    stHTMLRows += '<td align="right">'+numberWithCommas(amount)+'</td>';
                    stHTMLRows += '</tr>';
                }

                count++;
            }

            return stHTMLRows;

        }

        function buildRowsForDiscount(objSublistItems, stSubsidiary) {
            // log.debug('buildRowsForDiscount=>objSublistItems',objSublistItems);
            var stHTMLRows = ''
            var count = 1;
            var totalDiscountLength = 0;
            for (var item in objSublistItems){
                totalDiscountLength += objSublistItems[item].description.length;
                var stDescription = objSublistItems[item].description;
                stDescription = stDescription.replace(/\n/g, "<br />");
                // log.debug('buildRowsForDiscount=>stDescription',stDescription);

                var qty =  Number(objSublistItems[item].quantity).toFixed(2);
                var amount = Number(objSublistItems[item].amount).toFixed(2);
                var tax = Number(objSublistItems[item].tax).toFixed(2);
                var gross_amount = Number(objSublistItems[item].gross_amount).toFixed(2);


                if(totalDiscountLength < 400){
                    stHTMLRows += '<tr>';
                    stHTMLRows += '<td>'+count+'</td>';
                    stHTMLRows += '<td><p style="text-align: left">'+stDescription+'</p></td>';
                    stHTMLRows += '<td align="right">'+numberWithCommas(qty)+'</td>';
                    stHTMLRows += '<td align="right">'+numberWithCommas(amount)+'</td>';
                    if(stSubsidiary != 8) {
                        stHTMLRows += '<td align="right">' + numberWithCommas(tax) + '</td>';
                    }
                    stHTMLRows += '<td align="right">'+numberWithCommas(gross_amount)+'</td>';
                    stHTMLRows += '</tr>';
                }else{
                    stHTMLRows += '<tr style="margin-top: 0.4in">';
                    stHTMLRows += '<td>'+count+'</td>';
                    stHTMLRows += '<td><p style="text-align: left">'+stDescription+'</p></td>';
                    stHTMLRows += '<td align="right">'+numberWithCommas(qty)+'</td>';
                    stHTMLRows += '<td align="right">'+numberWithCommas(amount)+'</td>';
                    if(stSubsidiary != 8) {
                        stHTMLRows += '<td align="right">'+numberWithCommas(tax)+'</td>';
                    }
                    stHTMLRows += '<td align="right">'+numberWithCommas(gross_amount)+'</td>';
                    stHTMLRows += '</tr>';
                }

                count++;
            }

            return stHTMLRows;

        }

        function buildItemSublist(recInvoice){
            var objItems = {};
            var stHTML = '';
            var intLine = recInvoice.getLineCount('item');
            for(var indxLine = 0; indxLine < intLine; indxLine++){
                var stItemId = recInvoice.getSublistValue('item','item',indxLine);
                var stItemName = recInvoice.getSublistText('item','item',indxLine);
                var stDescription = recInvoice.getSublistValue('item','description',indxLine);
                var stQty = recInvoice.getSublistValue('item','quantity',indxLine);
                var stRate = recInvoice.getSublistValue('item','rate',indxLine);
                var stTaxAmount = (recInvoice.getSublistValue('item','tax1amt',indxLine)) ? recInvoice.getSublistValue('item','tax1amt',indxLine) : 0;
                var stAmount = recInvoice.getSublistValue('item','amount',indxLine);

                var stDescTrim = stDescription.trim();
                if(objItems[stDescTrim] == null){
                    objItems[stDescTrim] = {
                        'name' : stItemName,
                        'description' : stDescription,
                        'quantity' : 0,
                        'tax' : 0,
                        'rate' : 0,
                        'amount' : 0
                    }
                }

                objItems[stDescTrim].quantity += stQty;
                objItems[stDescTrim].tax += stTaxAmount;
                objItems[stDescTrim].rate += stRate;
                objItems[stDescTrim].amount += stAmount;
            }
            stHTML += '<tr style="background-color: #F5F5F5; color: #AAAAAA; font-weight: bold;">';
            stHTML +=    '<td width="5%">No.</td>';
            stHTML +=    '<td width="50%">Description</td>';
            stHTML +=    '<td align="right" width="9%">Qty</td>';
            stHTML +=    '<td align="right" width="13%">Amount</td>';
            stHTML +=    '<td align="right" width="12%">GST</td>';
            stHTML +=    '<td align="right" width="15%" style="white-space: nowrap">Gross Amount</td>';
            stHTML += '</tr>';

            var count = 1;
            for (var item in objItems){
                stHTML += '<tr>';
                stHTML += '<td>'+count+'</td>';
                stHTML += '<td>'+objItems[item].description+'</td>';
                stHTML += '<td align="right">'+Number(objItems[item].quantity).toFixed(2)+'</td>';
                stHTML += '<td align="right">'+Number(objItems[item].rate).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')+'</td>';
                stHTML += '<td align="right">'+Number(objItems[item].tax).toFixed(2)+'</td>';
                stHTML += '<td align="right">'+numberWithCommas(objItems[item].amount)+'</td>';
                stHTML += '</tr>';
                count++;
            }

            return stHTML;
        }


        function getCharges(inProject,inInvoiceId) {
            if(inProject){
                var arrCharges = [];
                var chargeSearchObj = search.create({
                    type: "charge",
                    filters:
                        [
                            ["job.internalid","anyof",inProject],
                            "AND",
                            ["use","anyof","Actual"],
                            "AND" ,
                            ["invoice.internalid","anyof",inInvoiceId]
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
                            search.createColumn({name: "chargedate", label: "Date"}),
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
                    objCharge.date = result.getValue('chargedate');
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

        function getReportDuration(recInvoice) {

            var stDuration = "";
            var dtStartDate = recInvoice.getValue('startdate');
            var dtEndDate = recInvoice.getValue('enddate');

            if(dtStartDate && dtEndDate){
                var sdate = new Date(dtStartDate);
                var edate = new Date(dtEndDate);
                var stStart = sdate.getDate() + '-' + monthConvertToString[sdate.getMonth()] + '-' + sdate.getFullYear().toString().substr(-2);
                var stEnd = edate.getDate() + '-' + monthConvertToString[edate.getMonth()] + '-' + edate.getFullYear().toString().substr(-2);
                stDuration = stStart + ' - ' + stEnd;
            }else{
                var dtTrandate = recInvoice.getValue('trandate');
                var date = new Date(dtTrandate);
                var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                var stFirst = firstDay.getDate() + '-' + monthConvertToString[firstDay.getMonth()] + '-' + firstDay.getFullYear().toString().substr(-2);
                var stLast = lastDay.getDate() + '-' + monthConvertToString[lastDay.getMonth()] + '-' + lastDay.getFullYear().toString().substr(-2);
                stDuration = stFirst + ' - ' + stLast;
            }

            return stDuration;
        }

        function getTaxCodeDescription(recInvoice) {
            var stTaxCode = '';

            var intLine = recInvoice.getLineCount('item');
            for(var indxLine = 0; indxLine < intLine; indxLine++){
                //var taxCode = (recInvoice.getSublistValue('item','taxcode',indxLine)) ? recInvoice.getSublistText('item','taxcode',indxLine) : '';
                var taxCodeGroupId = recInvoice.getSublistValue('item','taxcode',indxLine);
                if(taxCodeGroupId){
                    var taxCodeId = null;
                    var fldTaxGroup = search.lookupFields({
                        type : 'taxgroup',
                        id : taxCodeGroupId,
                        columns : ['taxitem1','taxitem2']
                    });
                    if(fldTaxGroup.taxitem1){
                        taxCodeId = fldTaxGroup.taxitem1[0].value;
                    }
                    if(taxCodeId){
                        //IF CAME FROM TAXGROUP
                        var fldTaxItem = search.lookupFields({
                            type : 'salestaxitem',
                            id : taxCodeId,
                            columns : ['description']
                        });
                        if(fldTaxItem.description){
                            stTaxCode = fldTaxItem.description;
                        }
                    }else{
                        //IF TAXITEM DIRECTLY
                        var fldTaxItem = search.lookupFields({
                            type : 'salestaxitem',
                            id : taxCodeGroupId,
                            columns : ['description']
                        });
                        if(fldTaxItem.description){
                            stTaxCode = fldTaxItem.description;
                        }
                    }

                    break;
                }
            }
            return stTaxCode;
        }

        function escapeRegExp(string) {
            return string.replace(/&/g, '&amp;');
        }

        var monthConvertToString = {
            0 : 'Jan',
            1 : 'Feb',
            2 : 'Mar',
            3 : 'Apr',
            4 : 'May',
            5 : 'Jun',
            6 : 'Jul',
            7 : 'Aug',
            8 : 'Sep',
            9 : 'Oct',
            10 : 'Nov',
            11 : 'Dec'
        }

        function price_in_words(price) {
            var sglDigit = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"],
                dblDigit = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"],
                tensPlace = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"],
                handle_tens = function(dgt, prevDgt) {
                    return 0 == dgt ? "" : " " + (1 == dgt ? dblDigit[prevDgt] : tensPlace[dgt])
                },
                handle_utlc = function(dgt, nxtDgt, denom) {
                    return (0 != dgt && 1 != nxtDgt ? " " + sglDigit[dgt] : "") + (0 != nxtDgt || dgt > 0 ? " " + denom : "")
                };

            var str = "",
                digitIdx = 0,
                digit = 0,
                nxtDigit = 0,
                words = [];
            if (price += "", isNaN(parseInt(price))) str = "";
            else if (parseInt(price) > 0 && price.length <= 10) {
                for (digitIdx = price.length - 1; digitIdx >= 0; digitIdx--) switch (digit = price[digitIdx] - 0, nxtDigit = digitIdx > 0 ? price[digitIdx - 1] - 0 : 0, price.length - digitIdx - 1) {
                    case 0:
                        words.push(handle_utlc(digit, nxtDigit, ""));
                        break;
                    case 1:
                        words.push(handle_tens(digit, price[digitIdx + 1]));
                        break;
                    case 2:
                        words.push(0 != digit ? " " + sglDigit[digit] + " Hundred" + (0 != price[digitIdx + 1] || 0 != price[digitIdx + 2] ? " and" : "") : "");
                        break;
                    case 3:
                        words.push(handle_utlc(digit, nxtDigit, "Thousand"));
                        break;
                    case 4:
                        words.push(handle_tens(digit, price[digitIdx + 1]));
                        break;
                    case 5:
                        words.push(handle_utlc(digit, nxtDigit, "Lakh"));
                        break;
                    case 6:
                        words.push(handle_tens(digit, price[digitIdx + 1]));
                        break;
                    case 7:
                        words.push(handle_utlc(digit, nxtDigit, "Crore"));
                        break;
                    case 8:
                        words.push(handle_tens(digit, price[digitIdx + 1]));
                        break;
                    case 9:
                        words.push(0 != digit ? " " + sglDigit[digit] + " Hundred" + (0 != price[digitIdx + 1] || 0 != price[digitIdx + 2] ? " and" : " Crore") : "")
                }
                str = words.reverse().join("")
            } else str = "";
            return str
        }

        return libFunction;

    });