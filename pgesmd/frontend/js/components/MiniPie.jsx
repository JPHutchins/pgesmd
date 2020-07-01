import React from "react";
import {
  Dropdown,
  DropdownButton,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { Pie } from "react-chartjs-2";
import { sum } from "ramda";
import { readableWattHours } from "../functions/readableWattHours";
import { useState } from "react";

/**
 * Return a flexibly sized ChartJS pie chart.
 */
const MiniPie = ({ energyHistory }) => {
  const [currentView, setCurrentView] = useState("activity");
  const labels = energyHistory.windowData.partitionTotalSums
    .map((x) => x.name)
    .concat("Passive");
  const colors = energyHistory.partitionOptions.value.map((x) => x.color);

  // these sums may be made availabe in the DP implementation of passive calc
  const makePieData = (currentView) => {
    switch (currentView) {
      case "total":
        return energyHistory.windowData.partitionTotalSums.map((x) => x.sum);
      case "activity":
        const active = energyHistory.windowData.partitionActiveSums.map(
          (x) => x.sum
        );
        const passive = energyHistory.windowData.partitionPassiveSums.reduce(
          (acc, x) => acc + x.sum,
          0
        );
        return active.concat(passive);
      case "average":
        const active2 = energyHistory.windowData.partitionActiveSums.map(
          (x) => x.sum
        );
        const partLengthArray = energyHistory.partitionOptions.value.map(
          (x, i) => {
            const parts = energyHistory.partitionOptions.value.length;
            const distance =
              energyHistory.partitionOptions.value[(i + 1) % parts].start -
              x.start;
            return distance >= 0 ? distance : 24 + distance;
          }
        );
        const totalHoursPerPart = partLengthArray.map(
          (x) => x * energyHistory.windowData.windowHours / 24
        );
        return active2.map((x, i) => x / totalHoursPerPart[i]);

      default:
        return;
    }
  };

  const pieData = makePieData(currentView);

  const data = {
    datasets: [
      {
        data: pieData,
        backgroundColor: colors,
      },
    ],
    labels: labels,
  };

  const options = {
    maintainAspectRatio: true,
    aspectRatio: 1,
    legend: {
      display: false,
    },
    tooltips: {
      callbacks: {
        title: (tooltipItem) => {
          return data.labels[tooltipItem[0].index];
        },
        label: (tooltipItem) => {
          return (
            Math.round(
              (data.datasets[0].data[tooltipItem.index] /
                sum(data.datasets[0].data)) *
                100
            ) +
            "%" +
            "\n" +
            readableWattHours(data.datasets[0].data[tooltipItem.index])
          );
        },
      },
    },
  };

  const makeTitle = (value) => {
    switch (value) {
      case "total":
        return "Total";
      case "activity":
        return "Activity";
      case "average":
        return "Average Activity";
    }
  };

  const makeTooltip = (value) => {
    switch (value) {
      case "total":
        return "Shows how much energy was used during each daily period";
      case "activity":
        return "Shows how much energy was actively used during each daily period compared to passive usage (fridge, AC, network, IoT)";
      case "average":
        return "Shows the average energy being actively used during each daily period";
    }
  };

  /**
   * Return the dropdown items with tooltip overlays.
   *
   * @param {String} value The title and tooltip to create: "total", "activity", "average"
   */
  const makeMenuItem = (value) => (
    <OverlayTrigger
      placement="left"
      overlay={<Tooltip>{makeTooltip(value)}</Tooltip>}
    >
      <Dropdown.Item eventKey={value}>{makeTitle(value)}</Dropdown.Item>
    </OverlayTrigger>
  );

  const handleClick = (e) => {
    console.log(e);
    setCurrentView(e);
  };

  return (
    <div>
      <div className="kilowatt-hour">Activities</div>
      <Pie data={data} options={options} height={null} width={null} />
      <DropdownButton
        size="sm"
        title={makeTitle(currentView)}
        onSelect={(e) => e != currentView && handleClick(e)}
      >
        {makeMenuItem("total")}
        {makeMenuItem("activity")}
        {makeMenuItem("average")}
      </DropdownButton>
    </div>
  );
};

export default MiniPie;
