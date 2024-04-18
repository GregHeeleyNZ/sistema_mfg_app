import React, { useState, useEffect } from "react";
// import { useRef } from "react";
// import { Container, Row, Col } from "react-bootstrap";
import styles from "../../assets/styling/ShiftSchedule.module.css";
import { Grid, Typography } from "@mui/material";
import {
  mqttFunctions,
  // mfgDashboardFunctions,
} from "./../../helpers/HelperScripts";
import mqtt from "mqtt";

import { muiThemes } from "../../assets/styling/muiThemes";
import { TableRowTypography } from "../../assets/styling/muiThemes";
const tableTheme = muiThemes.getSistemaTheme();


const JobStatus = (machineID /* { data } */) => {
  //#region MQTT Connect
  const thisHost = mqttFunctions.getHostname();
  const [client, setClient] = useState(null);
  var options = mqttFunctions.getOptions();
  const mqttConnect = (host, mqttOption) => {
    setClient(mqtt.connect(host, mqttOption));
  };
  //#endregion

  const [rtData, setRtData] = useState();
  const [mcData, setMcData] = useState();

  useEffect(() => {
    // console.log('JobStats.js useEffct fire every time')
  });

  useEffect(() => {
    //only fire on initial load
    mqttConnect(thisHost, options);
  }, []);

  useEffect(() => {
    //only fire on initial load
    if (rtData) {
    }
  }, [rtData]);
  useEffect(() => {
    //only fire on initial load
    if (mcData) {
    }
  }, [mcData]);

  useEffect(() => {
    if (client) {
      client.on("connect", () => {
        // setConnectStatus("Connected");
        // console.log("connection successful");
        mqttSub({
          topic: "food/st04/operations/dashboards/mattec/realtime",
          qos: 0,
        });
        mqttSub({
          topic: "food/st04/operations/dashboards/mattec/machinedata",
          qos: 0,
        });
      });
      client.on("message", (topic, message) => {
        // setConnectStatus("Connected");
        // console.log("connection successful");
        switch (topic) {
          case "food/st04/operations/dashboards/mattec/realtime":
            setRtData(
              JSON.parse(message.toString()).value.filter(
                (mc) =>
                  mc.Calculated_MachID.toLowerCase() ==
                  machineID.machineID.toLowerCase()
              )[0]
            );
            break;

          case "food/st04/operations/dashboards/mattec/machinedata":
            setMcData(
              JSON.parse(message.toString()).value.filter(
                (mc) =>
                  mc.Calculated_MachID.toLowerCase() ==
                  machineID.machineID.toLowerCase()
              )[0]
            );
            break;

          default:
        }
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

  const reqdQty =
    mcData == null ? null : parseInt(mcData.Calculated_RequiredQTY);
  const goodQty =
    mcData == null ? null : parseInt(mcData.Calculated_CurrentQTY);
  const remQty = mcData == null ? null : reqdQty - goodQty;

  const jobStart =
    rtData == null
      ? ""
      : new Date(parseInt(rtData.Calculated_StartTime) * 1000);
  const togo = mcData == null ? null : togoToDHMS(mcData.Calculated_TimeToGo);

  function togoToDHMS(tm) {
    //get days
    const days = Math.floor(tm / 24);
    tm = tm - days * 24;
    const hours = Math.floor(tm);
    tm = tm - hours;
    const mins = Math.floor(tm * 60);
    tm = days + " days " + hours + " hours " + mins + " mins";

    return tm;
  }

  return !mcData && !rtData ? (
    <React.Fragment></React.Fragment>
  ) : (
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
            Job Details
          </TableRowTypography>
        </Grid>

        <Grid item xs={5}>
        <TableRowTypography variant="h4">Est Time Left </TableRowTypography>
        </Grid>
        <Grid item xs={7}>
           <TableRowTypography variant="h3"> {togo} </TableRowTypography >
        </Grid>
        <Grid item xs={5}>
        <TableRowTypography variant="h4">Required QTY </TableRowTypography>
        </Grid>
        <Grid item xs={7}>
           <TableRowTypography variant="h3"> {reqdQty} </TableRowTypography >
        </Grid>
        <Grid item xs={5}>
           <TableRowTypography variant="h4">Completed Qty </TableRowTypography>
        </Grid>
        <Grid item xs={7}>
           <TableRowTypography variant="h3"> {goodQty} </TableRowTypography >
        </Grid>
        <Grid item xs={5}>
           <TableRowTypography variant="h4">Qty To Go </TableRowTypography>
        </Grid>
        <Grid item xs={7}>
           <TableRowTypography variant="h3"> {remQty} </TableRowTypography >
        </Grid>
      </Grid>
    </React.Fragment>
  );
};
export default JobStatus;

/**
 * {
    "Calculated_MachID": "B14",
    "Calculated_MachNo": 29,
    "Calculated_DeptNo": 8,
    "Calculated_OEE": "100",
    "Calculated_CycEff": "101.129388456262",
    "Calculated_YieldEff": "103.181607851505",
    "Calculated_AvgCycTime": "12.8548191563745",
    "Calculated_ScrapPercent": "0",
    "Calculated_DownPercent": "0",
    "Calculated_GoodProduction": "17264",
    "Calculated_TotalProduction": "17264",
    "Calculated_GoodPercent": "100",
    "Calculated_RunEfficency": "100",
    "Calculated_Berry105Efficiency": "106.45083759553",
    "Calculated_BerryMeefEfficiency": "100",
    "Calculated_LastCycTime": "12.8",
    "Calculated_TimeToGo": "86.604656853722",
    "Calculated_NextTool": "T627                ",
    "Calculated_NextJob": "A0316408100010      ",
    "Calculated_NextPartNum": "3402333                  ",
    "Calculated_NextPartDesc": "Lid Yogurt Pot Minty Teal                         ",
    "Calculated_CurrentJob": "A0316535100010      ",
    "Calculated_CurrentPartNum": "3402332                  ",
    "Calculated_CurrentPartDesc": "Lid Yogurt Pot Ocean Blue                         ",
    "Calculated_AssyCycTime": "1.60686962065668",
    "Calculated_ExpCycTime": "13",
    "Calculated_CurrentQTY": "25096",
    "Calculated_RequiredQTY": "215040",
    "RowIdent": "b667bf61-7c81-4f91-8e42-d11f2965ba25"
}/ */