/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(
    ['N/search', 'N/record', 'N/render', 'N/file', 'N/runtime', 'N/log', '../library files/common_2.0', 'N/xml', 'N/encode', 'N/email', 'N/https', 'N/url', '../library files/lodash.min', '../library files/moment .js', 'N/encode'],
    function (search, record, render, file, Runtime, Log, common, xml, encode, email, https, url, _, moment, encode) {

        var DELIMITER = ",", NEWLINE = "\n", zero = 0, blank_field = "";


        function SendStatusEmail(file_id) {
            log.debug("file_id", file_id)
            var gstr_file_record = record.load({ type: 'customrecord_gstr_file_record', id: 2 });
            var activityid = gstr_file_record.getValue({ fieldId: 'custrecord_gstr_file_activityid' });
            var file_type = gstr_file_record.getValue({ fieldId: 'custrecord_gstr_file_type' });
            var file_status = gstr_file_record.getValue({ fieldId: 'custrecord_gstr_file_status' });
            var file_name = gstr_file_record.getValue({ fieldId: 'custrecord_gstr_file_name' });
            var file_name_id = gstr_file_record.getValue({ fieldId: 'custrecord_gstr_file_id' });
            log.debug('file_name', file_name);
            log.debug('file_name_id', file_name_id);
            log.debug('json_obj values', JSON.stringify(gstr_file_record));

            var Report_type;

            if (file_type == "sales") {

                Report_type = "Sales"

            }
            if (file_type == "purchase") {

                Report_type = "Purchase"

            }


            var successful_file = file.load({
                id: file_name_id
            });


            var arrLines_successfile = successful_file.getContents().split(/\r?\n/);
            log.debug("arrLines_successfile", arrLines_successfile)
            // Check if the file is empty
            if (arrLines_successfile.length === 0) {
                log.error('Error', 'The file is empty.');
                return;
            }
            var ssarray = [];

            var headers = arrLines_successfile[0].split(';').map(header => header.trim().replace(/"/g, ''));

            let result = headers.map(item => item.replace(/"/g, '').trim()).filter(item => item !== "");
            log.debug("result", result);

            var targetColumnIndex = result[0].split(',');
            const valueAtPosition = targetColumnIndex.indexOf('Document Number');
            log.debug("targetColumnIndex", targetColumnIndex);
            log.debug("valueAtPosition", valueAtPosition);


            for (var i = 0; i < arrLines_successfile.length; i++) {

                // Split the line into an array based on semicolons
                var content = arrLines_successfile[i].split(';');
                var cantentvalues = content[0].split(',');
                // log.debug("cantentvalues", cantentvalues);

                ssarray.push({
                    "documentnumber": cantentvalues[valueAtPosition],
                    "documenttype": cantentvalues[0]
                })

            }
            log.debug("ssarray", ssarray);



            if (file_status == 'In-Progress') {
                var tenant = (file_type === 'sales') ? 'GSTSALES' : 'MAXITC';
                var api_url = 'https://api-sandbox.clear.in/integration/v1/ingest/file/' + file_type + '/status/' + activityid + '?tenant=' + tenant;
                var Api_Token = GetApiToken(1);
                var token_val = Api_Token[0].token;

                var headerObj_ingest = {
                    'x-cleartax-auth-token': token_val,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                };

                var response = https.get({ url: api_url, headers: headerObj_ingest });
                log.debug('json_obj values', JSON.stringify(response));


                var body_data = JSON.parse(response.body);

                if (body_data.status === 'ACTIVITY_COMPLETED') {
                    record.submitFields({
                        type: 'customrecord_gstr_file_record',
                        id: 2,
                        values: {
                            custrecord_gstr_file_status: 'done',
                            custrecord_gstr_file_final_status: JSON.stringify(body_data)
                        }
                    });
                    //log.debug('body_data',body_data.fileError.errorFileUrl);
                    var emailattributes;
                    var gstinBodyData = body_data.processingStats[0].gstin;
                    log.debug('body_data.processingStats', body_data.processingStats);
                    var file_id = writeFileIntoFileCabinet(body_data, gstinBodyData, Report_type);
                    var senderId = 10351;
                    var email_body = '<p>Please Find the attachment for the GST report</p><br><br>Thanks<br>';
                    var recipientId = 'himanshu.kumar@cinntra.com';
                    var fileObj = file.load({ id: file_id });
                    log.debug('body_data.fileError ', body_data.fileError);
                    //if (!body_data.fileError == null) {
                    if (body_data.fileError) {
                        log.debug('under condition')
                        var fileUrl = body_data.fileError.errorFileUrl;

                        var response = https.get({
                            url: fileUrl
                        });
                        var errorFileId;
                        if (response.code === 200) {
                            var fileContent = response.body;
                            log.debug('fileContent', fileContent);
                            var reencoded = encode.convert({
                                string: fileContent,
                                inputEncoding: encode.Encoding.BASE_64,
                                outputEncoding: encode.Encoding.UTF_8
                            });
                            var fileObj12 = file.create({
                                name: 'error_file',
                                fileType: file.Type.CSV,
                                contents: reencoded,
                                folder: 84175
                            });

                            var errorfileSave = fileObj12.save();
                            log.debug('errorfileSave Saved', 'File ID: ' + errorfileSave);
                            errorFileId = file.load({ id: errorfileSave });

                        }
                        emailattributes = {
                            author: senderId,
                            recipients: recipientId,
                            subject: 'GSTR_ ' + gstinBodyData + ' ' + Report_type + ' Report File Status',
                            body: email_body,
                            attachments: [fileObj, errorFileId]
                        };


                        var arrLines = errorFileId.getContents().split(/\r?\n/);
                        log.debug("arrLines", arrLines)

                        var errorfile_document = [];


                        // Check if the file is empty
                        if (arrLines.length === 0) {
                            log.error('Error', 'The file is empty.');
                            return;
                        }

                        else {
                            for (var a = 0; a < arrLines.length; a++) {

                                var array2 = arrLines[a].split(';');
                                // log.debug("array2", array2)
                                var arrayvalues = array2[0].split(',');
                                // log.debug("arrayvalues", arrayvalues)
                                errorfile_document.push({
                                    "documentnumber": arrayvalues[3],
                                    "documenttype": arrayvalues[2],
                                    "failedreason": arrayvalues[1]
                                });
                            }


                            //  log.debug("errorfile_document", errorfile_document)

                            var internalid_array_matchedfile = [];

                            var internalid_array_unmatchedfile = [];

                            // log.debug("errorfile_document.length", errorfile_document.length)
                            // log.debug("ssarray.length", ssarray.length)

                            const uniqueArrwithfailedreason = errorfile_document
                                .map(e => JSON.stringify(e)) // Convert objects to JSON strings
                                .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
                                .map(e => JSON.parse(e));

                            // log.debug("uniqueArrwithfailedreason", uniqueArrwithfailedreason)


                            var uniqueArrwithfailedreasonupdated = uniqueArrwithfailedreason.slice(1);
                            var unmatchedInArr1_uniqueArrwithfailedreasonupdated = uniqueArrwithfailedreasonupdated.filter(item => Object.keys(item).length > 0);
                            // log.debug("uniqueArrwithfailedreasonupdated", uniqueArrwithfailedreasonupdated)
                            // log.debug("uniqueArrwithfailedreasonupdated.length", uniqueArrwithfailedreasonupdated.length)
                            log.debug("unmatchedInArr1_uniqueArrwithfailedreasonupdated", unmatchedInArr1_uniqueArrwithfailedreasonupdated)
                            log.debug("unmatchedInArr1_uniqueArrwithfailedreasonupdated.length", unmatchedInArr1_uniqueArrwithfailedreasonupdated.length)


                            const successfuldocumnetnumber = ssarray.filter(item1 =>
                                errorfile_document.some(item2 =>
                                    String(item1.documentnumber) === item2.documentnumber &&
                                    String(item1.documenttype) === item2.documenttype
                                )
                            );


                            const unmatchedInArr1 = ssarray.filter(item1 =>
                                !errorfile_document.some(item2 =>
                                    String(item1.documentnumber) === item2.documentnumber &&
                                    String(item1.documenttype) === item2.documenttype
                                )
                            );

                            // log.debug("successfuldocumnetnumber", successfuldocumnetnumber)
                            // log.debug("successfuldocumnetnumber.length", successfuldocumnetnumber.length)

                            // log.debug("unmatchedInArr1", unmatchedInArr1)
                            // log.debug("unmatchedInArr1.length", unmatchedInArr1.length)

                            var successfuldocumnetnumberupdated = successfuldocumnetnumber.filter(item => item.documentnumber !== "Document Number");
                            // log.debug("successfuldocumnetnumberupdated", successfuldocumnetnumberupdated)
                            // log.debug("successfuldocumnetnumberupdated.length", successfuldocumnetnumberupdated.length)

                            var unmatchedInArr1updated = unmatchedInArr1.filter(item => item.documentnumber !== "Document Number");
                            var unmatchedInArr1updated1 = unmatchedInArr1updated.filter(item => item.documenttype !== "");

                            // log.debug("unmatchedInArr1updated1", unmatchedInArr1updated1)
                            // log.debug("unmatchedInArr1updated1.length", unmatchedInArr1updated1.length)

                            const uniqueObjs = successfuldocumnetnumberupdated.filter((item, index, self) =>
                                index === self.findIndex((t) => (
                                    t.documentnumber === item.documentnumber && t.documenttype === item.documenttype
                                ))
                            );

                            const uniqueObjs2 = uniqueArrwithfailedreasonupdated.filter((item, index, self) =>
                                index === self.findIndex((t) => (
                                    t.documentnumber === item.documentnumber && t.documenttype === item.documenttype
                                ))
                            );

                            log.debug("uniqueObjs", uniqueObjs)
                            log.debug("uniqueObjs.length", uniqueObjs.length)

                            // log.debug("uniqueObjs2", uniqueObjs2)
                            // log.debug("uniqueObjs2.length", uniqueObjs2.length)


                            for (var s = 0; s < uniqueObjs.length; s++) {

                                var recordtype = "";
                                var recordtypefilter = "";

                                if (uniqueObjs[s].documenttype == "INVOICE") {
                                    recordtype = "invoice"
                                    recordtypefilter = "CustInvc"
                                }

                                if (uniqueObjs[s].documenttype == "CREDIT NOTE") {
                                    recordtype = "creditmemo"
                                    recordtypefilter = "CustCred"
                                }

                                if (uniqueObjs[s].documenttype == "CASH SALE") {
                                    recordtype = "cashsale"
                                    recordtypefilter = "CashSale"
                                }

                                if (uniqueObjs[s].documenttype == "BILL") {
                                    recordtype = "vendorbill"
                                    recordtypefilter = "VendBill"
                                }

                                if (uniqueObjs[s].documenttype == "DEBIT NOTE") {
                                    recordtype = "vendorcredit"
                                    recordtypefilter = "VendCred"
                                }


                                var internalid_bill;
                                var vendorbillSearchObj = search.create({
                                    type: "transaction",
                                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }, { "name": "includeperiodendtransactions", "value": "F" }],
                                    filters:
                                        [
                                            ["formulatext: {tranid}", "startswith", uniqueObjs[s].documentnumber],
                                            "AND",
                                            ["mainline", "is", "F"],
                                            "AND",
                                            ["shipping", "is", "F"],
                                            "AND",
                                            ["taxline", "is", "F"],
                                            "AND",
                                            ["item", "noneof", "@NONE@"],
                                            "AND",
                                            ["type", "anyof", recordtypefilter]
                                        ],
                                    columns:
                                        [
                                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                                            search.createColumn({ name: "tranid", label: "Document Number" }),
                                            search.createColumn({ name: "item", label: "Item" }),
                                            search.createColumn({ name: "type", label: "Type" }),
                                            search.createColumn({ name: "custbody_successfully_uploaded_on_clea", label: "Successfully Uploaded On cleartax" })


                                        ]
                                });
                                var searchResultCount = vendorbillSearchObj.runPaged().count;
                                //log.debug("vendorbillSearchObj result count", searchResultCount);
                                vendorbillSearchObj.run().each(function (result) {

                                    internalid_array_matchedfile.push({
                                        "internalid": result.getValue({ name: "internalid", label: "Internal ID" }),
                                        "transactiontype": recordtype
                                    })

                                    return true;
                                });





                            }


                            const unique = internalid_array_matchedfile.filter((item, index, self) =>
                                index === self.findIndex((t) => (
                                    t.internalid === item.internalid && t.transactiontype === item.transactiontype
                                ))
                            );

                            log.debug("internalid_array_matchedfile", unique)
                            log.debug("internalid_array_matchedfile.length", unique.length)

                            for (var r = 0; r < unique.length; r++) {
                                log.debug("unique[r].transactiontype", unique[r].transactiontype)
                                log.debug("unique[r].internalid", unique[r].internalid)

                                var transactionrecord = record.submitFields({
                                    type: unique[r].transactiontype,
                                    id: unique[r].internalid,
                                    values: {
                                        custbody_successfully_uploaded_on_clea: true,
                                        custbody_failed_reason: ''
                                    }
                                })
                                log.debug("transactionrecord", transactionrecord)

                            }



                            for (var s = 0; s < unmatchedInArr1_uniqueArrwithfailedreasonupdated.length; s++) {

                                log.debug("unmatchedInArr1_uniqueArrwithfailedreasonupdated[s]", unmatchedInArr1_uniqueArrwithfailedreasonupdated[s])



                                var recordtype = "";
                                var recordtypefilter = "";
                                var originaldocumentnumber;

                                if (unmatchedInArr1_uniqueArrwithfailedreasonupdated[s].documenttype == '"INVOICE"') {
                                    recordtype = "invoice"
                                    recordtypefilter = "CustInvc"
                                }

                                if (unmatchedInArr1_uniqueArrwithfailedreasonupdated[s].documenttype == '"CREDIT NOTE"') {
                                    recordtype = "creditmemo"
                                    recordtypefilter = "CustCred"
                                }

                                if (unmatchedInArr1_uniqueArrwithfailedreasonupdated[s].documenttype == '"CASH SALE"') {
                                    recordtype = "cashsale"
                                    recordtypefilter = "CashSale"
                                }

                                if (unmatchedInArr1_uniqueArrwithfailedreasonupdated[s].documenttype == '"BILL"') {
                                    recordtype = "vendorbill"
                                    recordtypefilter = "VendBill"
                                }

                                if (unmatchedInArr1_uniqueArrwithfailedreasonupdated[s].documenttype == '"DEBIT NOTE"') {
                                    recordtype = "vendorcredit"
                                    recordtypefilter = "VendCred"
                                }




                                if (unmatchedInArr1_uniqueArrwithfailedreasonupdated[s].documentnumber) {

                                    var documentnumber = unmatchedInArr1_uniqueArrwithfailedreasonupdated[s].documentnumber

                                    originaldocumentnumber = documentnumber.replaceAll('"', '');

                                }

                                // log.debug("originaldocumentnumber", originaldocumentnumber);
                                // log.debug("recordtype", recordtype)
                                // log.debug("recordtypefilter", recordtypefilter)


                                var internalid_bill;
                                var vendorbillSearchObj = search.create({
                                    type: "transaction",
                                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }, { "name": "includeperiodendtransactions", "value": "F" }],
                                    filters:
                                        [
                                            ["formulatext: {tranid}", "startswith", originaldocumentnumber],
                                            "AND",
                                            ["mainline", "is", "F"],
                                            "AND",
                                            ["shipping", "is", "F"],
                                            "AND",
                                            ["taxline", "is", "F"],
                                            "AND",
                                            ["item", "noneof", "@NONE@"],
                                            "AND",
                                            ["type", "anyof", recordtypefilter]
                                        ],
                                    columns:
                                        [
                                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                                            search.createColumn({ name: "tranid", label: "Document Number" }),
                                            search.createColumn({ name: "item", label: "Item" }),
                                            search.createColumn({ name: "type", label: "Type" }),
                                            search.createColumn({ name: "custbody_successfully_uploaded_on_clea", label: "Successfully Uploaded On cleartax" })


                                        ]
                                });
                                var searchResultCount = vendorbillSearchObj.runPaged().count;
                                vendorbillSearchObj.run().each(function (result) {

                                    internalid_array_unmatchedfile.push({
                                        "internalid": result.getValue({ name: "internalid", label: "Internal ID" }),
                                        "transactiontype": recordtype,
                                        "failedreason": unmatchedInArr1_uniqueArrwithfailedreasonupdated[s].failedreason

                                    });


                                    return true;
                                });

                                // log.debug("internalid_array_unmatchedfile", internalid_array_unmatchedfile);




                            }

                            const unique3 = internalid_array_unmatchedfile.filter((item, index, self) =>
                                index === self.findIndex((t) => (
                                    t.internalid === item.internalid && t.transactiontype === item.transactiontype && t.failedreason == item.failedreason
                                ))
                            );

                            log.debug("unique3", unique3)
                            log.debug("unique3.length", unique3.length)


                            for (var rr = 0; rr < unique3.length; rr++) {
                                log.debug("unique3[rr].transactiontype", unique3[rr].transactiontype)
                                log.debug("unique3[rr].internalid", unique3[rr].internalid)
                                log.debug("unique3[rr].failedreason", unique3[rr].failedreason)

                                var transactionrecord = record.submitFields({
                                    type: unique3[rr].transactiontype,
                                    id: unique3[rr].internalid,
                                    values: {
                                        custbody_successfully_uploaded_on_clea: false,
                                        custbody_failed_reason: unique3[rr].failedreason
                                    }
                                })
                                log.debug("transactionrecord", transactionrecord)

                            }

                        }


                    }
                    else {
                        emailattributes = {
                            author: senderId,
                            recipients: recipientId,
                            subject: 'GSTR_ ' + gstinBodyData + ' ' + Report_type + ' Report File Status',
                            body: email_body,
                            attachments: [fileObj]
                        };


                        const obj1 = ssarray
                            .map(e => JSON.stringify(e)) // Convert objects to JSON strings
                            .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
                            .map(e => JSON.parse(e));

                        // log.debug("uniqueArrwithfailedreason", uniqueArrwithfailedreason)


                        var obj1_updated = obj1.slice(1);
                        log.debug("obj1_updated", obj1_updated)

                        const unique111 = obj1_updated.filter((item, index, self) =>
                            index === self.findIndex((t) => (
                                t.documentnumber === item.documentnumber && t.documenttype === item.documenttype
                            ))
                        );

                        const obj2 = unique111.filter(entry => entry.documentnumber && entry.documenttype);
                        log.debug("obj2", obj2)
                        log.debug("obj2.length", obj2.length)




                        var internalidarray_1 = [];

                        for (var p = 0; p < obj2.length; p++) {

                            var recordtype = "";
                            var recordtypefilter = "";

                            if (obj2[p].documenttype == "INVOICE") {
                                recordtype = "invoice"
                                recordtypefilter = "CustInvc"
                            }

                            if (obj2[p].documenttype == "CREDIT NOTE") {
                                recordtype = "creditmemo"
                                recordtypefilter = "CustCred"
                            }

                            if (obj2[p].documenttype == "CASH SALE") {
                                recordtype = "cashsale"
                                recordtypefilter = "CashSale"
                            }

                            if (obj2[p].documenttype == "BILL") {
                                recordtype = "vendorbill"
                                recordtypefilter = "VendBill"
                            }

                            if (obj2[p].documenttype == "DEBIT NOTE") {
                                recordtype = "vendorcredit"
                                recordtypefilter = "VendCred"
                            }

                            var vendorbillSearchObj = search.create({
                                type: "transaction",
                                settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }, { "name": "includeperiodendtransactions", "value": "F" }],
                                filters:
                                    [
                                        ["formulatext: {tranid}", "startswith", obj2[p].documentnumber],
                                        "AND",
                                        ["mainline", "is", "F"],
                                        "AND",
                                        ["shipping", "is", "F"],
                                        "AND",
                                        ["taxline", "is", "F"],
                                        "AND",
                                        ["item", "noneof", "@NONE@"],
                                        "AND",
                                        ["type", "anyof", recordtypefilter]
                                    ],
                                columns:
                                    [
                                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                                        search.createColumn({ name: "tranid", label: "Document Number" }),
                                        search.createColumn({ name: "item", label: "Item" }),
                                        search.createColumn({ name: "type", label: "Type" }),
                                        search.createColumn({ name: "custbody_successfully_uploaded_on_clea", label: "Successfully Uploaded On cleartax" })


                                    ]
                            });
                            var searchResultCount = vendorbillSearchObj.runPaged().count;
                            //log.debug("vendorbillSearchObj result count", searchResultCount);
                            vendorbillSearchObj.run().each(function (result) {

                                internalidarray_1.push({
                                    "internalid": result.getValue({ name: "internalid", label: "Internal ID" }),
                                    "transactiontype": recordtype
                                })

                                return true;
                            });

                        }


                        const unique11 = internalidarray_1.filter((item, index, self) =>
                            index === self.findIndex((t) => (
                                t.internalid === item.internalid && t.transactiontype === item.transactiontype
                            ))
                        );

                        log.debug("unique11", unique11)
                        log.debug("unique11.length", unique11.length)

                        for (var r1 = 0; r1 < unique11.length; r1++) {
                            log.debug("unique11[r].transactiontype", unique11[r1].transactiontype)
                            log.debug("unique11[r].internalid", unique11[r1].internalid)

                            var transactionrecord = record.submitFields({
                                type: unique11[r1].transactiontype,
                                id: unique11[r1].internalid,
                                values: {
                                    custbody_successfully_uploaded_on_clea: true,
                                    custbody_failed_reason: ''
                                }
                            })
                            log.debug("transactionrecord", transactionrecord)

                        }


                    }

                    email.send(emailattributes);
                }
            }
        }

        function getFileName(gstinBodyData, Report_type) {
            var formattedDate = moment().format('YYMMDD');
            return 'GSTR_' + gstinBodyData + '_' + Report_type + '_Report_Status_' + formattedDate + '.txt';

        }

        function writeFileIntoFileCabinet(fileContent, gstinBodyData, Report_type) {
            var FOLDER_ID = 84175;
            var fileName = getFileName(gstinBodyData, Report_type);

            try {
                var fileRec = file.create({
                    name: fileName,
                    fileType: file.Type.PLAINTEXT,
                    contents: JSON.stringify(fileContent, null, 4)
                });
                fileRec.folder = FOLDER_ID;
                var file_id = fileRec.save();
            } catch (E) {
                log.error('Error while creating file', E);
                throw E;
            }

            return file_id;
        }

        function GetApiToken(gstin) {
            var filters = [["internalid", "is", 1]];
            var columns = [
                search.createColumn({ name: "custrecord_api_gstin", label: "gstin" }),
                search.createColumn({ name: "custrecord_api_token", label: "token" })
            ];

            var token_data = common.searchAllRecord('customrecord_gstin_token_for_api', null, filters, columns);
            var Token_Details = common.pushSearchResultIntoArray(token_data);

            log.debug('Token_Details Token_Details', JSON.stringify(Token_Details));
            return Token_Details;
        }

        return {
            execute: SendStatusEmail
        };

    });