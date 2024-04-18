import React, { useState, useEffect } from "react";
import { useRef } from "react";
import { Grid,  TextField, useForkRef } from "@mui/material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import Button from "@mui/material/Button"
import {
  mqttFunctions,
  mfgDashboardFunctions,
} from "./../../helpers/HelperScripts";

import { connections } from "../../ConnectionBroker";

import mqtt from "mqtt";

import { muiThemes } from "../../assets/styling/muiThemes";
import { TableRowTypography } from "../../assets/styling/muiThemes";
const tableTheme = muiThemes.getSistemaTheme();

const Actions = ({ fetchJobDetails }) => {
  //#region MQTT Connect
  const thisHost = mqttFunctions.getHostname();
  const [client, setClient] = useState(null);
  var options = mqttFunctions.getOptions();
  const mqttConn = (host, mqttOption) => {
    setClient(mqtt.connect(host, mqttOption));
  };
  //#endregion

  const [partPalletErr, setPartPalletErr] = useState(true);
  const [employeeErr, setEmployeeErr] = useState(true);

  const pltHelperText = useRef("");
  const empHelperText = useRef("");
  const employeeID = useRef(null);
  const employee = useRef({ employeeID: "", employeeName: "" });

  const fullPalletQty = useRef();
  const bookQty = useRef(0);
  const [employeeData, setEmployeeData] = useState();
  const [jobData, setJobData] = useState({ ium: "" });

  // const { employeeData, jobData,topic } = data;
  const basePalletTopic =
    connections.getBaseMQTTTopicFromPort() +
    "/+/+/inventorymove/receivemfgparttoinventory";

  //#region  Dialog setups

  const [openPalletQtyConfirm, setOpenPalletQtyConfirm] = React.useState(false);
  const [openPalletQtySet, setOpenPalletQtySet] = React.useState(false);
  const [openEmployeeSet, setOpenEmployeeSet] = React.useState(false);

  const handleEmployeeSetOpen = () => {
    setJobData(fetchJobDetails());
    setEmployeeErr(true);
    setOpenEmployeeSet(true);
  };
  const handleEmployeeSetClose = () => {
    setOpenEmployeeSet(false);
    //reset for next time
    employee.current = { employeeID: "", employeeName: "" };
  };
  const handleEmployeeSetCloseBook = () => {
    setOpenEmployeeSet(false);
    if (bookQty.current == 0) bookQty.current = fullPalletQty.current;
    setOpenPalletQtyConfirm(true);
  };

  const handlePltQtySetOpen = () => {
    setJobData(fetchJobDetails());
    setOpenPalletQtySet(true);
  };
  const handlePltQtySetClose = () => {
    setOpenPalletQtySet(false);
    setPartPalletErr(true);
    //reset for next time
    bookQty.current = 0;
  };

  const handlePltQtySetCloseBook = () => {
    setOpenPalletQtySet(false);
    setPartPalletErr(true);
    setOpenEmployeeSet(true);
  };

  const handlePltQtyConfirmClose = () => {
    setOpenPalletQtyConfirm(false);
    bookQty.current = 0;
  };

  const handlePltQtyConfirmCloseBook = () => {
    setOpenPalletQtyConfirm(false);
    handleBookPalletClick();
  };
  //#endregion

  if (jobData) {
  }

  useEffect(() => {
    // console.log(`You clicked ${count} times every render`);
    // console.log("Actions.js useEffct fire every time");
  });

  //will only fire on 1st render. Fires before 1st render only
  useEffect(() => {
    //only fire on initial load
    mqttConn(thisHost, options);
  }, []);

  useEffect(() => {
    //only fire on initial load
    fullPalletQty.current = parseInt(jobData.pq);
    if (jobData.ium.toLowerCase() === "ct") {
      fullPalletQty.current = jobData.pq / jobData.cq;
    }
  }, [jobData]);

  useEffect(() => {
    if (client) {
      client.on("connect", () => {
        // setConnectStatus("Connected");
        // console.log("connection successful");
        /*         mqttSub({
          topic: "food/st04/operations/dashboards/epicor/jobs",
          qos: 0,
        }); */
        mqttSub({
          topic: "food/st04/operations/dashboards/epicor/employeeslist",
          qos: 0,
        });
      });
      client.on("message", (topic, message) => {
        // setConnectStatus("Connected");
        // console.log("connection successful");
        switch (topic) {
          case "food/st04/operations/dashboards/epicor/employeeslist":
            setEmployeeData(JSON.parse(message.toString()).value);

            break;

          default:
        }
        console.log(
          `Actions.js received message from topic: ${topic} at ${Date.now()}`
        );
      });
      client.on("error", (err) => {
        console.error("Connection error: ", err);
        client.end();
      });
      client.on("reconnect", () => {
        // setConnectStatus("Reconnecting");
      });
    }
  }, [client]);

  let record = {
    topic:
      connections.getBaseMQTTTopicFromPort() +
      "/cellRef/mcRef/inventorymove/receivemfgparttoinventory",
    qos: 0,
    retain: true,
    payload: Date.now().toString(),
    status: "",
  };

  function handleBookPalletClick(message) {
    record.payload = Date.now().toString();
    record.status = 0;
    record.bookqty = bookQty.current;
    record.employee = employee.current;
    record.asm = jobData.asm;
    mqttPublish(record);
    //reset values
    bookQty.current = 0;
    employee.current = { employeeID: "", employeeName: "" };
  }

  function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  const handlePltQtyChange = (event) => {
    const val = event.target.value;
    let pltErr = true;

    if (
      isNumeric(val) &&
      parseInt(val) > 0 &&
      parseInt(val) < fullPalletQty.current
    ) {
      pltHelperText.current = "";
      bookQty.current = parseInt(event.target.value);
      pltErr = false;
    } else if (isNumeric(val) && parseInt(val) > fullPalletQty.current) {
      pltHelperText.current = "Please enter less than a full pallet qty";
    } else {
      pltHelperText.current = "Please enter a valid number";
    }
    setPartPalletErr(pltErr);

    //console.log("value is:", event.target.value);
  };

  const handleEmployeeChange = (event) => {
    const val = event.target.value;
    let emperr = true;
    employeeID.current = null;
    const emp = employeeData.filter((e) => e.EmpBasic_EmpID == val)[0];
    if (emp) {
      emperr = false;
      empHelperText.current = "";

      employeeID.current = val;
      employee.current.employeeID = emp.EmpBasic_EmpID;
      employee.current.employeeName = emp.EmpBasic_Name;
    } else {
      empHelperText.current = "PLease enter valid Employee Number";
    }
    setEmployeeErr(emperr);
  };
  const mqttSub = (subscription) => {
    if (client) {
      // topic & QoS for MQTT subscribing
      const { topic, qos } = subscription;
      // subscribe topic
      client.subscribe(topic, { qos }, (error) => {
        if (error) {
          console.log("Subscribe to topics error", error);
          return;
        }
        //console.log(`Subscribe to topics: ${topic}`);
      });
    }
  };
  const mqttPublish = (context) => {
    if (client) {
      // topic, QoS & payload for publishing message
      //let bookQty = jobDetails.current.palletQty;

      let { topic, qos, retain, payload, status, bookqty, employee } = context;

      topic = topic
        .replace("cellRef", jobData.cell)
        .replace("mcRef", jobData.mc)
        .toLowerCase();

      payload = { tstamp: payload };
      payload.jobnum = jobData.jn;
      payload.resourceid = jobData.mc;
      payload.assemblyseq = jobData.asm;
      payload.partnum = jobData.pn;
      payload.status = status;

      payload.acttranqty = bookqty;
      payload.empid = employee.employeeID;
      payload.empname = employee.employeeName;
      payload = JSON.stringify(payload);
      console.log(payload);
      //console.log(jobDetails.current);

      client.publish(topic, payload, { qos, retain }, (error) => {
        if (error) {
          console.log("Publish error: ", error);
        }
      });
    }
  };

  return (
    <React.Fragment>
      <Grid container>
        <Grid
          item
          xs={12}
          sx={{
            paddingLeft: 2,
            paddingTop: 1,
            paddingBottom: 1,
            marginBottom: 1,
            backgroundColor: tableTheme.palette.sistema.klipit.light,
          }}
        >
          <TableRowTypography
            variant="h2"
            paddingRight={16}
            alignSelf={"center"}
            color={tableTheme.palette.sistema.klipit.contrastText}
          >
            Job Booking
          </TableRowTypography>
        </Grid>
        <Grid item xs={6}>
          <FormControl>
            <FormControlLabel sx={{margin:1}} control={<Button  onClick={handleEmployeeSetOpen}>Book Full Pallet</Button>} />
          </FormControl>
          {/* <div>
            <Button variant="outlined" onClick={handleEmployeeSetOpen}>
              Book Full Pallet
            </Button>
          </div> */}
        </Grid>
        <Grid item xs={6}>
        <FormControl>
            <FormControlLabel sx={{margin:1}} control={<Button onClick={handlePltQtySetOpen}>Book Part Pallet</Button>} />
          </FormControl>
          {/* <div>
            <Button variant="outlined" onClick={handlePltQtySetOpen}>
              Book Part Pallet
            </Button>
          </div> */}
        </Grid>
      </Grid>

      <div id="dialogs">
        <Dialog
          open={openEmployeeSet}
          onClose={handleEmployeeSetClose}
          maxWidth={"sm"}
          fullWidth={true}
        >
          <DialogTitle>Employee Details</DialogTitle>
          <DialogContent style={{ height: "100px" }}>
            <DialogContentText>Enter your Employee Number</DialogContentText>
            <TextField
              error={employeeErr}
              id="outlined-error"
              defaultValue=""
              color="primary"
              variant="filled"
              helperText={empHelperText.current}
              onChange={handleEmployeeChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEmployeeSetClose}>Cancel</Button>
            <Button disabled={employeeErr} onClick={handleEmployeeSetCloseBook}>
              Continue
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openPalletQtySet}
          onClose={handlePltQtySetClose}
          maxWidth={"sm"}
          fullWidth={true}
        >
          <DialogTitle>Part Pallet Quantity</DialogTitle>
          <DialogContent style={{ height: "100px" }}>
            <DialogContentText>
              Enter Quantity to book into Epicor in {jobData.ium} units
            </DialogContentText>
            <TextField
              error={partPalletErr}
              id="outlined-error"
              defaultValue="0"
              color="primary"
              variant="filled"
              helperText={pltHelperText.current}
              onChange={handlePltQtyChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePltQtySetClose}>Cancel</Button>
            <Button disabled={partPalletErr} onClick={handlePltQtySetCloseBook}>
              Continue
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openPalletQtyConfirm}
          onClose={handlePltQtyConfirmClose}
          maxWidth={"sm"}
          fullWidth={true}
        >
          <DialogTitle>Confirm Pallet Booking</DialogTitle>
          <DialogContent style={{ height: "100px" }}>
            <DialogContentText>
              This will book {bookQty.current} {jobData.ium} into Epicor by{" "}
              {employee.current.employeeName}
            </DialogContentText>
            <DialogContentText>Proceed?</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePltQtyConfirmClose}>Cancel</Button>
            <Button onClick={handlePltQtyConfirmCloseBook}>Book</Button>
          </DialogActions>
        </Dialog>
      </div>
    </React.Fragment>
  );
};
export default Actions;