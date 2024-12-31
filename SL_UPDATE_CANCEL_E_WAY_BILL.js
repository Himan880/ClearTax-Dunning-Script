 /**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/encode', 'N/file', "N/https", "N/url", 'N/task', 'N/format'],
    /**
     * @param {record} record
     * @param {runtime} runtime
     * @param {search} search
     */
    function(record, runtime, search, serverWidget, encode, file, https, url, task, format) {

        var itemDetailsMapObject = {};
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            var request = context.request;
            var response = context.response;

            if (request.method == 'GET') {

                var Form = serverWidget.createForm({
                    title: 'Cancel/Update E-Way Bill',
                    hideNavBar: false
                });
                Form.clientScriptModulePath = './CS_CANCEL_UPDATE_E_WAY_BILL.js';
                var update_cancelOption = Form.addField({
                    id: 'custpage_update_cancel_reason',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Update/Cancel'

                });
                update_cancelOption.addSelectOption({
                    value: '',
                    text: 'Select'
                });
                update_cancelOption.addSelectOption({
                    value: '1',
                    text: 'Cancel'
                });
                update_cancelOption.addSelectOption({
                    value: '2',
                    text: 'Update'
                });
                var inv_data = GetInvoiceToCancel();
                var select_invoice_cancel = Form.addField({
                    id: 'custpage_select_invoice',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Cancel E-way Bill Transaction#'

                });

                select_invoice_cancel.addSelectOption({
                    value: '',
                    text: 'Select'
                });
                for (var k = 0; k < inv_data.length; k++) {
                    var internalid = inv_data[k].recId;
                    var tranid = inv_data[k].documentNumber;
                    select_invoice_cancel.addSelectOption({
                        value: internalid,
                        text: tranid
                    });
                }
				 var updateApi = Form.addField({
                    id: 'custpage_update_api',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Update Method'
                });
                updateApi.addSelectOption({
                    value: '',
                    text: 'Select'
                });
                updateApi.addSelectOption({
                    value: '1',
                    text: 'Update E-Waybill Transporter ID'
                });
                updateApi.addSelectOption({
                    value: '3',
                    text: 'Extend E-Waybill Validity'
                });
                var select_invoice_update = Form.addField({
                    id: 'custpage_select_invoice_update',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Update E-way Bill Transaction#'
                });
                select_invoice_update.addSelectOption({
                    value: '',
                    text: 'Select'
                });
                var updateapi = updateApiData();
                for (var count = 0; count < updateapi.length; count++) {
                    var internalid = updateapi[count].recId;
					log.debug('internalid',internalid);
                    var tranid = updateapi[count].documentNumber;
					log.debug('tranid',tranid);
                    select_invoice_update.addSelectOption({
                        value: internalid,
                        text: tranid
                    });
                }
               var selectInvoiceTrans = Form.addField({
                    id: 'custpage_select_invoice_transporterid',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Update E-way Bill Transaction#'
                });
                log.debug('selectInvoiceTrans',selectInvoiceTrans);
				selectInvoiceTrans.addSelectOption({
                    value: '',
                    text: 'Select'
                });
                var updateTransapi = updateApiTransData();
				log.debug('updateTransapi',updateTransapi);
                for (var count1 = 0; count1 < updateTransapi.length; count1++) {
                    var internalidtranDoc = updateTransapi[count1].recId;
                    var tranidTranDoc = updateTransapi[count1].documentNumber;
                    selectInvoiceTrans.addSelectOption({
                        value: internalidtranDoc,
                        text: tranidTranDoc
                    });
                }
                var cancel_reason = Form.addField({
                    id: 'custpage_cancel_reason',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Cancel Reason'

                });
                cancel_reason.addSelectOption({
                    value: '',
                    text: 'Select'
                });
                cancel_reason.addSelectOption({
                    value: '1',
                    text: 'Duplicate'
                });
                cancel_reason.addSelectOption({
                    value: '2',
                    text: 'Data entry mistake'
                });
                cancel_reason.addSelectOption({
                    value: '3',
                    text: 'Order Cancelled'
                });
                cancel_reason.addSelectOption({
                    value: '4',
                    text: 'Others'
                });

                var transporter_doc_no = Form.addField({
                    id: 'custpage_transporter_doc_no',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Transporter Document Number'

                });
                var transporter_doc_date = Form.addField({
                    id: 'custpage_transporter_doc_date',
                    type: serverWidget.FieldType.DATE,
                    label: 'Transporter Document Date'

                });

                var cancel_remark = Form.addField({
                    id: 'custpage_cancel_remark',
                    type: serverWidget.FieldType.LONGTEXT,
                    label: 'Cancel Remark'

                });
                cancel_remark.defaultValue = '';

                cancel_remark.setHelpText({
                    help: "Add Remark with in 100 char",
                    showInlineForAssistant: true
                });
                var e_way_bill_no = Form.addField({
                    id: 'custpage_e_way_bill_no',
                    type: serverWidget.FieldType.TEXT,
                    label: 'E-Way Bill Number'
                });
                e_way_bill_no.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                var vehicleNumber = Form.addField({
                    id: 'custpage_vehicle_number',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Vehicle Number'
                });
                var transporter_id = Form.addField({
                    id: 'custpage_transporterid',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Transporter Id'
                });
                var remainDistance = Form.addField({
                    id: 'custpage_remaindistance',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Reamining Distance'
                });



                var update_remark = Form.addField({
                    id: 'custpage_update_remark',
                    type: serverWidget.FieldType.LONGTEXT,
                    label: 'Update Remark'

                });
                update_remark.defaultValue = '';
                update_remark.setHelpText({
                    help: "Add Remark with in 100 char",
                    showInlineForAssistant: true
                });
                var from_place = Form.addField({
                    id: 'custpage_from_place',
                    type: serverWidget.FieldType.TEXT,
                    label: 'From Place'

                });
                from_place.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                var from_state = Form.addField({
                    id: 'custpage_from_state',
                    type: serverWidget.FieldType.TEXT,
                    label: 'From State'

                });
                from_state.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                var documentDate = Form.addField({
                    id: 'custpage_document_date',
                    type: serverWidget.FieldType.DATE,
                    label: 'Document Date'

                });
                var validaity_update_reason = Form.addField({
                    id: 'custpage_validaity_update_reason',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Validity Update Reason'
                });
                validaity_update_reason.addSelectOption({
                    value: '',
                    text: 'Select'
                });
                validaity_update_reason.addSelectOption({
                    value: '1',
                    text: 'NATURAL_CALAMITY'
                });
                validaity_update_reason.addSelectOption({
                    value: '2',
                    text: 'TRANSSHIPMENT'
                });
                validaity_update_reason.addSelectOption({
                    value: '3',
                    text: 'OTHERS'
                });
                validaity_update_reason.addSelectOption({
                    value: '4',
                    text: 'ACCIDENT'
                });
                validaity_update_reason.addSelectOption({
                    value: '5',
                    text: 'LAW_ORDER_SITUATION'
                });
                var part_b_update_reason = Form.addField({
                    id: 'custpage_part_b_update_reason',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Part-B Update Reason'
                });
                part_b_update_reason.addSelectOption({
                    value: '',
                    text: 'Select'
                });
                part_b_update_reason.addSelectOption({
                    value: '1',
                    text: 'BREAKDOWN'
                });
                part_b_update_reason.addSelectOption({
                    value: '2',
                    text: 'TRANSSHIPMENT'
                });
                part_b_update_reason.addSelectOption({
                    value: '3',
                    text: 'OTHERS'
                });
                part_b_update_reason.addSelectOption({
                    value: '4',
                    text: 'FIRST_TIME'
                });

                var from_pincode = Form.addField({
                    id: 'custpage_from_pincode',
                    type: serverWidget.FieldType.TEXT,
                    label: 'From PinCode'
                });

                from_pincode.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                var transport_mode = Form.addField({
                    id: 'custpage_transport_mode',
                    type: serverWidget.FieldType.SELECT,
                    label: 'TransPort Mode'
                });
                transport_mode.addSelectOption({
                    value: '',
                    text: 'Select'
                });
                transport_mode.addSelectOption({
                    value: '1',
                    text: 'ROAD'
                });
                transport_mode.addSelectOption({
                    value: '2',
                    text: 'RAIL'
                });
                transport_mode.addSelectOption({
                    value: '3',
                    text: 'AIR'
                });
                transport_mode.addSelectOption({
                    value: '4',
                    text: 'SHIP'
                });
                transport_mode.addSelectOption({
                    value: '5',
                    text: 'IN_TRANSIT'
                });
                var vechileType = Form.addField({
                    id: 'custpage_transport_type',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Vehicle Type'
                });
                vechileType.addSelectOption({
                    value: '',
                    text: 'Select'
                });
                vechileType.addSelectOption({
                    value: 'REGULAR',
                    text: 'Regular'
                });
                vechileType.addSelectOption({
                    value: 'ODC',
                    text: 'ODC'
                });


                Form.addSubmitButton({
                    label: 'Submit'
                });




                response.writePage(Form);

            } else {

                try {
                    var Form = serverWidget.createForm({
                        title: 'Cancel/Update E-Way Bill',
                        hideNavBar: false
                    });
                    Form.clientScriptModulePath = './CS_CANCEL_UPDATE_E_WAY_BILL.js';
            
                    var output = url.resolveScript({
                        scriptId: 'customscript_sl_update_cancel_e_way_bill',
                        deploymentId: 'customdeploy_sl_update_cancel_e_way_bill',
                        returnExternalUrl: false
                    });
                    var html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Execution Successful</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 0;
        }
        .container {
            background-color: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .success-message {
            font-size: 24px;
            color: #4CAF50; /* Green color */
            margin-bottom: 20px;
        }
        .redirect-message {
            font-size: 18px;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-message">
            <p>Action Performed Succesfully!</p>
        </div>
        <div class="redirect-message">
            <p>Redirecting to Main Screen...</p>
        </div>
    </div>

    <script>
        setTimeout(function() {
            window.location.href = '${output}'; // Replace with your actual URL
        }, 7000); // 3000 milliseconds = 3 seconds
    </script>
</body>
</html>
`
                    const Sub_val = [{
                            name: "271",
                            code: '2'
                        },
                        {
                            name: "272",
                            code: '2'
                        },
                        {
                            name: "269",
                            code: '2'
                        },
                        {
                            name: "266",
                            code: '2'
                        },
                        {
                            name: "267",
                            code: '2'
                        },
                        {
                            name: "259",
                            code: '3'
                        },
                        {
                            name: "258",
                            code: '3'
                        },
                        {
                            name: "260",
                            code: '3'
                        },
                        {
                            name: "257",
                            code: '3'
                        },
                        {
                            name: "252",
                            code: '3'
                        },
                        {
                            name: "253",
                            code: '3'
                        },
                        {
                            name: "251",
                            code: '3'
                        }
                    ];
                    var parameters = request.parameters;
                    log.debug('parameters', parameters);
                    var actionType = parameters.custpage_update_cancel_reason;
                    log.debug('actionType', actionType);
                    var checkBoxValue = parameters.custpage_checkbox
                    if (actionType == 1) {
                        var cancel_reason;
                        var cancel_reason_value = parameters.custpage_cancel_reason;
                        if (cancel_reason_value == 1) {
                            cancel_reason = 'DUPLICATE'
                        }
                        if (cancel_reason_value == 2) {
                            cancel_reason = 'DATA_ENTRY_MISTAKE'
                        }
                        if (cancel_reason_value == 3) {
                            cancel_reason = 'ORDER_CANCELLED'
                        }
                        if (cancel_reason_value == 4) {
                            cancel_reason = 'OTHERS'
                        }

                        var cancel_remark = parameters.custpage_cancel_remark;
                        var recordId = parameters.custpage_select_invoice;
                        var recType;
                        var transactionSearchObj = search.create({
                            type: "transaction",
                            settings: [{
                                "name": "consolidationtype",
                                "value": "ACCTTYPE"
                            }],
                            filters: [
                                ["internalid", "anyof", recordId],
                                "AND",
                                ["mainline", "is", "T"]
                            ],
                            columns: [
                                search.createColumn({
                                    name: "type",

                                    label: "Type"
                                }),
                                search.createColumn({
                                    name: "internalid",

                                    label: "Internal ID"
                                }),
                                search.createColumn({
                                    name: "custbody_in_eway_bill_no",

                                    label: "E-Way Bill No."
                                })
                            ]
                        });
                        var searchResultCount = transactionSearchObj.runPaged().count;
                        log.debug("transactionSearchObj result count", searchResultCount);
                        transactionSearchObj.run().each(function(result) {
                            recType = result.getText({
                                name: "type",

                            });
                            log.debug('recType', recType);
                            EwayBill = result.getValue({
                                name: "custbody_in_eway_bill_no",
                            });
                            log.debug('EwayBill', EwayBill);
                            return true;
                        });
                        var recordType;
                        if (recType == 'CreditMemo') {
                            recordType = 'creditmemo'
                        }
                        if (recType == 'Invoice') {
                            recordType = 'invoice'
                        }
                        var objRecord = record.load({
                            type: recordType,
                            id: recordId
                        })
                        var nexus = objRecord.getValue({
                            fieldId: 'nexus'
                        });
                        var subsidiary = objRecord.getValue({
                            fieldId: 'subsidiary'
                        });
                        var ewayNo = objRecord.getValue({
                            fieldId: 'custbody_in_eway_bill_no'
                        });
                  
                        var sub_index = _.findIndex(Sub_val, function(Sub_val) {
                            return Sub_val.name == subsidiary
                        });
                        if (sub_index !== -1) {
                            sub_code = Sub_val[sub_index].code;
                            var Sub_val_array = _.filter(Sub_val, {
                                'code': sub_code
                            });

                        }
                        var Api_Token = GetApiToken(sub_code);
                        log.debug('Api_Token', Api_Token);
                        var token_val = Api_Token[0].Token_Details;
                        log.debug('token_val', token_val);
                        var sellerGstin;
                        var sellerOrgGSTIN = objRecord.getValue({
                            fieldId: 'custbody_gst_id_txn'
                        })
                        if (sellerOrgGSTIN == '29AAAFK7554R1ZI') {
                            sellerGstin = '29AAFCD5862R000'
                        }
                        if (sellerOrgGSTIN == '33AAAFK7554R1ZT') {
                            sellerGstin = '33AAFCD5862R009'
                        }
                        if (sellerOrgGSTIN == '04ABEFM7032P1Z1') {
                            sellerGstin = '04AAFCD5862R021'
                        }
                        if (sellerOrgGSTIN == '06ABEFM7032P1ZX') {
                            sellerGstin = '06AAFCD5862R017'
                        }
                        if (sellerOrgGSTIN == '27ABEFM7032P1ZT') {
                            sellerGstin = '27AAFCD5862R013'
                        }
                        if (sellerOrgGSTIN == '07ABEFM7032P1ZV') {
                            sellerGstin = '07AAFCD5862R007'
                        }
                        if (sellerOrgGSTIN == '08AAQFS0580H1ZV') {
                            sellerGstin = '08AAFCD5862R018'
                        }
                        if (sellerOrgGSTIN == '06AAQFS0580H2ZY') {
                            sellerGstin = '06AAFCD5862R017'
                        }

                        if (sellerOrgGSTIN == '07AAQFS0580H1ZX') {
                            sellerGstin = '07AAFCD5862R007'
                        }
                        if (sellerOrgGSTIN == '27AAAFK7554R1ZM') {
                            sellerGstin = '27AAFCD5862R013'
                        }




                        var headerObj = new Array();
                        headerObj['X-Cleartax-Auth-Token'] = token_val.toString();
                        headerObj['Content-Type'] = 'application/json';
                        headerObj['Accept'] = 'application/json';
                        headerObj['gstin'] = sellerGstin;
                        var url_new = 'https://api-sandbox.clear.in/einv/v2/eInvoice/ewaybill/cancel';
                        log.debug('url_new url_new', JSON.stringify(url_new));
                        var psg_ei_content = {
                            "ewbNo": parseInt(ewayNo),
                            "cancelRsnCode": cancel_reason,
                            "cancelRmrk": cancel_remark
                        }


                        log.debug('json_obj psg_ei_content', JSON.stringify(psg_ei_content));

                        var response = https.post({
                            url: url_new,
                            body: JSON.stringify(psg_ei_content),
                            headers: headerObj
                        });
                        log.debug('response', response);
                        log.debug('json_obj response', JSON.stringify(response.body));
                        var body_val = JSON.parse(response.body);
                        log.debug('body_val', body_val);
                        var is_success = body_val.ewbStatus;
                        log.debug('is_success', is_success);
                        if (is_success == 'CANCELLED') {
                            log.debug('check canceled condition')
                            // objRecord.setValue({
                            //     fieldId: 'custbody_in_eway_bill_no',
                            //     value: null
                            // });
                            objRecord.setValue({
                                fieldId: 'custbody_in_eway_export_status',
                                value: 4
                            });
                            log.debug('checkBoxValue', checkBoxValue);
                         
                        } else {
                            objRecord.setValue({
                                fieldId: 'custbody_e_way_bill_error',
                                value: body_val.errorDetails.error_message
                            });
                        }

                        var recordId = objRecord.save();
                        log.debug('recordId', recordId);
                        if (recordId) {


                            context.response.write(html)
                        }
                    }
                    if (actionType == 2) {

                        var recordId;
						var extId = parameters.custpage_select_invoice_update;
						var tranId = parameters.custpage_select_invoice_transporterid
						if(extId){
							recordId = extId
						}
						else{
							recordId = tranId
						}
						log.debug('recordId',recordId)
                        var recType;
                        var EwayBill;
                        var updateAPi = parameters.custpage_update_api;
                        var transactionSearchObj = search.create({
                            type: "transaction",
                            settings: [{
                                "name": "consolidationtype",
                                "value": "ACCTTYPE"
                            }],
                            filters: [
                                ["internalid", "anyof", recordId],
                                "AND",
                                ["mainline", "is", "T"]
                            ],
                            columns: [
                                search.createColumn({
                                    name: "type",
                                 
                                    label: "Type"
                                }),
                                search.createColumn({
                                    name: "internalid",
                                    label: "Internal ID"
                                }),
                                search.createColumn({
                                    name: "custbody_in_eway_bill_no",
                                    label: "E-Way Bill No."
                                })
                            ]
                        });
                        var searchResultCount = transactionSearchObj.runPaged().count;
                        log.debug("transactionSearchObj result count", searchResultCount);
                        transactionSearchObj.run().each(function(result) {
                            recType = result.getText({
                                name: "type",
                            });
                            log.debug('recType', recType);
                            EwayBill = result.getValue({
                                name: "custbody_in_eway_bill_no",
                            });
                            log.debug('EwayBill', EwayBill);
                            return true;
                        });
                        var recordType;
                        if (recType == 'CreditMemo') {
                            recordType = 'creditmemo'
                        }
                        if (recType == 'Invoice') {
                            recordType = 'invoice'
                        }
                        var objRecord = record.load({
                            type: recordType,
                            id: recordId
                        })
                        var nexus = objRecord.getValue({
                            fieldId: 'nexus'
                        });
                        var subsidiary = objRecord.getValue({
                            fieldId: 'subsidiary'
                        });
                        var ewayNo = objRecord.getValue({
                            fieldId: 'custbody_in_eway_bill_no'
                        });
                        // var Seller_Details = GetSellerDetails(subsidiary, nexus);
                        // log.debug('Seller_Details', Seller_Details);
                        // var Api_Token = GetApiToken(Seller_Details[0].taxregistrationnumber);
                        // log.debug('Api_Token', Api_Token);
                        // var token_val = Api_Token[0].Token_Details;
                        // log.debug('token_val', token_val);
                        // var gstin_val = Seller_Details[0].taxregistrationnumber;
                        // log.debug('gstin_val', gstin_val);
					// 	 const Sub_val1 = [{
                    //         name: "271",
                    //         code: '2'
                    //     },
                    //     {
                    //         name: "272",
                    //         code: '2'
                    //     },
                    //     {
                    //         name: "269",
                    //         code: '2'
                    //     },
                    //     {
                    //         name: "266",
                    //         code: '2'
                    //     },
                    //     {
                    //         name: "267",
                    //         code: '2'
                    //     },
                    //     {
                    //         name: "259",
                    //         code: '3'
                    //     },
                    //     {
                    //         name: "258",
                    //         code: '3'
                    //     },
                    //     {
                    //         name: "260",
                    //         code: '3'
                    //     },
                    //     {
                    //         name: "257",
                    //         code: '3'
                    //     },
                    //     {
                    //         name: "252",
                    //         code: '3'
                    //     },
                    //     {
                    //         name: "253",
                    //         code: '3'
                    //     },
                    //     {
                    //         name: "251",
                    //         code: '3'
                    //     }
                    // ];
					// var sub_code1;
					// 	var sub_index1 = _.findIndex(Sub_val1, function(Sub_val1) {
                    //         return Sub_val1.name == subsidiary
                    //     });
                    //     if (sub_index1 !== -1) {
                    //         sub_code1 = Sub_val1[sub_index1].code;
                    //         var Sub_val_array = _.filter(Sub_val1, {
                    //             'code': sub_code1
                    //         });

                    //     }
					// 	log.debug('sub_code1',sub_code1);
                    //     var Api_Token = GetApiToken(sub_code1);
                    //     log.debug('Api_Token', Api_Token);
                    //     var token_val = Api_Token[0].Token_Details;
                    //     log.debug('token_val', token_val);
					
						
                        // var sellerGstin;
                        // // '07AAFCD5862R007'
                        // var sellerOrgGSTIN = objRecord.getValue({
                        //     fieldId: 'custbody_gst_id_txn'
                        // })
                        // if (sellerOrgGSTIN == '29AAAFK7554R1ZI') {
                        //     sellerGstin = '29AAFCD5862R000'
                        // }
                        // if (sellerOrgGSTIN == '33AAAFK7554R1ZT') {
                        //     sellerGstin = '33AAFCD5862R009'
                        // }
                        // if (sellerOrgGSTIN == '04ABEFM7032P1Z1') {
                        //     sellerGstin = '04AAFCD5862R021'
                        // }
                        // if (sellerOrgGSTIN == '06ABEFM7032P1ZX') {
                        //     sellerGstin = '06AAFCD5862R017'
                        // }
                        // if (sellerOrgGSTIN == '27ABEFM7032P1ZT') {
                        //     sellerGstin = '27AAFCD5862R013'
                        // }
                        // if (sellerOrgGSTIN == '07ABEFM7032P1ZV') {
                        //     sellerGstin = '07AAFCD5862R007'
                        // }
                        // if (sellerOrgGSTIN == '08AAQFS0580H1ZV') {
                        //     sellerGstin = '08AAFCD5862R018'
                        // }
                        // if (sellerOrgGSTIN == '06AAQFS0580H2ZY') {
                        //     sellerGstin = '06AAFCD5862R017'
                        // }

                        // if (sellerOrgGSTIN == '07AAQFS0580H1ZX') {
                        //     sellerGstin = '07AAFCD5862R007'
                        // }
                        // if (sellerOrgGSTIN == '27AAAFK7554R1ZM') {
                        //     sellerGstin = '27AAFCD5862R013'
                        // }
                        var gstin = objRecord.getValue({fieldId:'custbody_from_location_gstin'});
			var subId = objRecord.getValue({
				fieldId : 'subsidiary'
			})
			 var subsidiarySearchObj = search.create({
   type: "subsidiary",
   filters:
   [
      ["internalid","anyof",subId]
   ],
   columns:
   [
    
      search.createColumn({name: "taxregistrationnumber", label: "Tax Reg. Number"}),
    
   ]
});
var searchResultCount = subsidiarySearchObj.runPaged().count;
log.debug("subsidiarySearchObj result count",searchResultCount);
 var results = subsidiarySearchObj.run().getRange({start : 0, end   : 1000})
	    var gstiN = results[0].getValue({name: "taxregistrationnumber",label: "Name"});

 var apiKey = "1.0eb9341d-7c09-45b6-bf6b-990bc5c9f41c_8ce2942dcac053d671a52e0ce48573bafbce18269d1fcef266dd84b72c95869a"
                        if (updateAPi == 1) {

                            var transporterId = parameters.custpage_transporterid;


                            var headers = {
                                "X-Cleartax-Auth-Token": apiKey,
                                "gstin": gstiN,
                                "Content-Type": "application/json",
                                "Accept": "application/json"
                            };

                            var payload = JSON.stringify({
                                "EwbNumber": parseInt(ewayNo),
                                "TransporterId": transporterId
                            });

                            var response = https.post({
                                url: "https://api-sandbox.clear.in/einv/v1/ewaybill/update?action=UPDATE_TRANSPORTER_ID",
                                headers: headers,
                                body: payload
                            });
                            log.debug('response', response);
                            log.debug('response', response.body);
                            log.debug('json_obj response', JSON.parse(response.body));
                            var body_val = JSON.parse(response.body);
                            var is_success = body_val.UpdatedDate;
                            log.debug('is_success', is_success);
                            if (is_success) {
								log.debug('transporterId',transporterId);
                                objRecord.setValue({
                                    fieldId: 'custbody_in_eway_transport_id',
                                    value: transporterId
                                });
                                objRecord.setValue({
                                    fieldId: 'custbody_in_eway_export_status',
                                    value: 3
                                });
						

                                context.response.write(html)
                            } else {
                                objRecord.setValue({
                                    fieldId: 'custbody_e_way_bill_error',
                                    value: body_val.errors[0].error_message
                                });
                                context.response.write(body_val.errors[0].error_message)
                            }
                        }
                        if (updateAPi == 3) {


                            var fromPlace = parameters.custpage_from_place;
                            var fromState = parameters.custpage_from_state;
                            var vechileNumber = parameters.custpage_vehicle_number;
                            var docDate = parameters.custpage_document_date;
                            log.debug('docDate', docDate);
                            var transportMode = parameters.inpt_custpage_transport_mode
                            log.debug('transportMode', transportMode);
                            var vechileType = parameters.custpage_transport_type
                            var resonsRemark = parameters.custpage_update_remark;
                            var reasonCode = parameters.inpt_custpage_part_b_update_reason
                            var docNum = parameters.inpt_custpage_select_invoice_update;
                            var tranDoc = parameters.custpage_transporter_doc_no;
                            var tranDate = parameters.custpage_transporter_doc_date;
                            var pinCode = parameters.custpage_from_pincode
                            var validaityReason = parameters.inpt_custpage_validaity_update_reason;
                            var remainDistance = parameters.custpage_remaindistance
                            function formatDate(date) {
                                // Split the input date by the slash (/)
                                const parts = date.split('/');
                            
                                // Pad the month and day with leading zeros if necessary
                                const month = parts[0].padStart(2, '0');
                                const day = parts[1].padStart(2, '0');
                                const year = parts[2];
                            
                                // Return the formatted date
                                return `${month}/${day}/${year}`;
                            }
                            const inputDate = docDate;
                            const formattedDate = formatDate(inputDate);
                            log.debug(formattedDate); 
                            var apiRecTypeVa
                            if (recType == 'CreditMemo') {
                                apiRecTypeVa = 'INV'
                            }
                            if (recType == 'Invoice') {
                                apiRecTypeVa = 'INV'
                            }

                            var headers = {
                                "X-Cleartax-Auth-Token": apiKey,
                                "gstin": gstiN,
                                "Content-Type": "application/json",
                                "Accept": "application/json"
                            };

                            var payload = JSON.stringify({
                                "EwbNumber": parseInt(ewayNo),
                                "FromPlace": fromPlace,
                                "FromState": fromState,
                                "FromPincode": pinCode,
                                "ReasonCode": validaityReason,
                                "ReasonRemark": resonsRemark,
                                "TransDocNo": tranDoc,
                                "TransDocDt": tranDate,
                                "TransMode": transportMode,
                                "DocumentNumber": docNum,
                                "DocumentType": apiRecTypeVa,
                                "RemainingDistance": remainDistance,
                                "DocumentDate": formattedDate,
                                "VehicleType": vechileType,
                                "VehNo": vechileNumber,
                                "ConsignmentStatus": 'MOVEMENT'
                            });

                            var response = https.post({
                                url: "https://api-sandbox.clear.in/einv/v1/ewaybill/update?action=EXTEND_VALIDITY",
                                headers: headers,
                                body: payload
                            });
                            log.debug('response', response);
                            log.debug('json_obj response', JSON.stringify(response.body));
                            var body_val = JSON.stringify(response.body);
                            var body_val12 = JSON.parse(body_val);
                            log.debug('body_val12',body_val12);
                            var is_success = body_val12.ValidUpto;
                            log.debug('is_success', is_success);
                            if (is_success) {
                                objRecord.setValue({
                                    fieldId: 'custbody_in_eway_bill_valid_until_date',
                                    value: is_success
                                });
                                objRecord.setValue({
                                    fieldId: 'custbody_in_eway_export_status',
                                    value: 3
                                });
                                objRecord.setValue({
                                    fieldId: 'shipdate',
                                    value: docDate
                                });
                                objRecord.setValue({
                                    fieldId: 'custbody_transporter_doc_number',
                                    value: tranDoc
                                });
                          //  }
                              // context.response.write(html)
                            } else {
                                log.debug('body_val12.errors',body_val12);

                                objRecord.setValue({
                                    fieldId: 'custbody_e_way_bill_error',
                                    value: body_val12
                                });
                             // context.response.write(body_val12)
                            }
                        }

                        var recordId = objRecord.save();
                        log.debug('recordId', recordId);
                        if (recordId) {


                           context.response.write(html)
                        }
                    }
                } catch (ex) {
                    log.error('error in post method', ex)
                    context.response.write(ex)
                }


            }


        }


        

        function GetApiToken(gstin) {
            var filters = [
                ["internalid", "is", gstin]
            ];

            var columns = [
                search.createColumn({
                    name: "custrecord_api_gstin",
                    label: "gstin"
                }),
                search.createColumn({
                    name: "custrecord_api_token",
                    label: "token"
                })
            ];
            var Token_Details = [];
            var apiToken = search.create({
                type: "customrecord_gstin_token_for_api",
                filters: filters,
                columns: columns
            });
            var searchResultCount = apiToken.runPaged().count;
            log.debug("apiToken result count", searchResultCount);

            apiToken.run().each(function(result) {
                var objAdd = {};
                objAdd.token_data = result.getValue({
                    name: "custrecord_api_gstin"
                });
                objAdd.Token_Details = result.getValue({
                    name: "custrecord_api_token"
                });
                Token_Details.push(objAdd)
                return true;
            });
            return Token_Details;
        }

        function GetInvoiceToCancel() {
            var transactionSearchObj = search.create({
                type: "transaction",
                settings: [{
                    "name": "consolidationtype",
                    "value": "ACCTTYPE"
                }],
                filters: [
                    ["type", "anyof", "CustInvc", "CustCred"],
                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["custbody_in_eway_bill_no", "isnotempty", ""],
                    "AND",
                    ["custbody_in_eway_export_status", "noneof", "4"],
                  
                ],
                columns: [
                    search.createColumn({
                        name: "tranid",

                        label: "Document Number"
                    }),
                    search.createColumn({
                        name: "trandate",

                        label: "Date"
                    }),
                    search.createColumn({
                        name: "custbody_in_eway_bill_no",

                        label: "E-Way Bill No."
                    }),
                    search.createColumn({
                        name: "custbody_in_eway_bill_valid_until_date",

                        label: "Valid Until"
                    }),
                    search.createColumn({
                        name: "internalid",

                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "type",

                        label: "Type"
                    })
                ]
            });
            var searchResultCount = transactionSearchObj.runPaged().count;
            log.debug("transactionSearchObj result count", searchResultCount);
            var data_invoice = [];

            transactionSearchObj.run().each(function(result) {

                var validUtil = result.getValue({
                    name: "custbody_in_eway_bill_valid_until_date",

                });
                log.debug('validUtil cancel', validUtil);


                const now = new Date(); // Current time in local timezone

                let givenDate = new Date(validUtil);
                log.debug('givenDate', givenDate);


                // Calculate the difference in milliseconds
                // const differenceInMilliseconds = now - givenDate;

               // Convert 24 hours to milliseconds
                // const twentyFourHoursInMilliseconds = 24 * 60 * 60 * 1000;

               // Check if the difference is within 24 hours
                // const isWithin24Hours = differenceInMilliseconds <= twentyFourHoursInMilliseconds;
                // log.debug('isWithin24Hours', isWithin24Hours);
                if (givenDate > now) {
                    var obj = {}
                    obj.documentNumber = result.getValue({
                        name: "tranid",
                    });
                    obj.recId = result.getValue({
                        name: "internalid",
                    });
                    data_invoice.push(obj)
                }
                return true;
            });
            return data_invoice;

        }

        function updateApiTransData() {
            var transactionSearchTranObj = search.create({
                type: "transaction",
                settings: [{
                    "name": "consolidationtype",
                    "value": "ACCTTYPE"
                }],
                filters: [
                    ["type", "anyof", "CustInvc", "CustCred"],


                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["custbody_in_eway_export_status", "noneof", "4"],
"AND",
                    ["custbody_in_eway_export_status", "noneof", "@NONE@"]


                ],
                columns: [
                    search.createColumn({
                        name: "tranid",
                        label: "Document Number"
                    }),
                    search.createColumn({
                        name: "trandate",
                        label: "Date"
                    }),
                    search.createColumn({
                        name: "custbody_in_eway_bill_no",
                        label: "E-Way Bill No."
                    }),
                    search.createColumn({
                        name: "custbody_in_eway_bill_valid_until_date",

                        label: "Valid Until"
                    }),
                    search.createColumn({
                        name: "internalid",

                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "type",

                        label: "Type"
                    })
                ]
            });
            var searchResultCount = transactionSearchTranObj.runPaged().count;
            log.debug("transactionSearchObj result Trans count", searchResultCount);
            var data_invoice_update_tran = [];

            transactionSearchTranObj.run().each(function(result) {
                var validUtil = result.getValue({
                    name: "custbody_in_eway_bill_valid_until_date"
                });
                log.debug('validUtil in update', validUtil);
                const now = new Date();

                // Convert to UTC and then to IST (UTC +5:30)
                const istOffset = 5.5 * 60; // IST is UTC +5:30
                const utcOffset = now.getTimezoneOffset(); // Get the offset in minutes from UTC
                // Calculate the time in IST
                const istTime = new Date(now.getTime() + (istOffset + utcOffset) * 60 * 1000);
                const currentTime = istTime.toISOString(); // Format as ISO string
                let expiryDate = new Date(validUtil);
               
                // const endWindow = new Date(expiryDate.getTime() + 8 * 60 * 60 * 1000); // 8 hours after expiry
                // log.debug('endWindow', endWindow);

      //  if (validUtil && !isNaN(expiryDate.getTime())) {
  //  log.debug('Expiry Date:', expiryDate);

    // Compare the current time (IST) with the expiry date
   // if (currentTime <= expiryDate.toISOString()) {
                    log.debug('documentNumber')
                    var obj = {}
                    obj.documentNumber = result.getValue({
                        name: "tranid",

                    });
                    obj.recId = result.getValue({
                        name: "internalid",

                    });
                    data_invoice_update_tran.push(obj)
                   //  }
			//}
                return true;
            });
            return data_invoice_update_tran;

        }
        
        function updateApiData() {
            var transactionSearchObj = search.create({
                type: "transaction",
                settings: [{
                    "name": "consolidationtype",
                    "value": "ACCTTYPE"
                }],
                filters: [
                    ["type", "anyof", "CustInvc", "CustCred"],


                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["custbody_in_eway_export_status", "noneof", "4"],
                  "AND",
                    ["custbody_in_eway_export_status", "noneof", "@NONE@"],



                ],
                columns: [
                    search.createColumn({
                        name: "tranid",
                        label: "Document Number"
                    }),
                    search.createColumn({
                        name: "trandate",
                        label: "Date"
                    }),
                    search.createColumn({
                        name: "custbody_in_eway_bill_no",
                        label: "E-Way Bill No."
                    }),
                    search.createColumn({
                        name: "custbody_in_eway_bill_valid_until_date",

                        label: "Valid Until"
                    }),
                    search.createColumn({
                        name: "internalid",

                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "type",

                        label: "Type"
                    })
                ]
            });
            var searchResultCount = transactionSearchObj.runPaged().count;
            log.debug("transactionSearchObj result count", searchResultCount);
            var data_invoice_update = [];

            transactionSearchObj.run().each(function(result) {
                var validUtil = result.getValue({
                    name: "custbody_in_eway_bill_valid_until_date"
                });
                log.debug('validUtil in update', validUtil);
				  let expiryDate = new Date(validUtil);
				if (isNaN(expiryDate.getTime())) {
    log.error("Invalid expiry date:", validUtil);
} 
else{
                const now = new Date();

                // Convert to UTC and then to IST (UTC +5:30)
                const istOffset = 5.5 * 60; // IST is UTC +5:30
                const utcOffset = now.getTimezoneOffset(); // Get the offset in minutes from UTC

                // Calculate the time in IST
                const istTime = new Date(now.getTime() + (istOffset + utcOffset) * 60 * 1000);

                const currentTime = istTime.toISOString(); // Format as ISO string
              

                const startWindow = new Date(expiryDate.getTime() - 8 * 60 * 60 * 1000).toISOString(); // 8 hours before expiry
               // log.debug('startWindow', startWindow);
                const endWindow = new Date(expiryDate.getTime() + 8 * 60 * 60 * 1000).toISOString(); // 8 hours after expiry
                //log.debug('endWindow', endWindow);

                if ((currentTime >= startWindow && currentTime <= endWindow) && (validUtil != null || validUtil != '')) {
					log.debug('transactionCount',result.getValue({
                        name: "tranid",

                    }))
                    log.debug('documentNumber')
                    var obj = {}
                    obj.documentNumber = result.getValue({
                        name: "tranid",

                    });
                    obj.recId = result.getValue({
                        name: "internalid",

                    });
                    data_invoice_update.push(obj)
                }
				}
                return true;
            });
			
            return data_invoice_update;

        }
        return {
            onRequest: onRequest
        };

    });