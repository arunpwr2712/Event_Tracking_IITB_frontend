import React from "react";
import "../views/Views.css";

const LABS = [
  { floor: "1st", pi: "Swapnil Shinde", name: "Cilia Biology Lab", no: "105" },
  { floor: "1st", pi: "Sreelaja Nair", name: "Vertebrate Embryogenesis Lab", no: "104" },

  { floor: "2nd", pi: "Neeta Kanekar", name: "Movement Neuroscience and Rehabilitation Technology Lab", no: "202" },
  { floor: "2nd", pi: "Ambarish Kunwar", name: "Biophysics and Computational Biology Laboratory", no: "204" },
  { floor: "2nd", pi: "Hari Varma", name: "Theoretical and Experimental Bioimaging Lab", no: "203" },

  { floor: "3rd", pi: "Sanjeeva Srivastava", name: "Proteomics Lab", no: "304" },
  { floor: "3rd", pi: "Rahul Purwar", name: "Immunoengineering Lab", no: "302" },

  { floor: "4th", pi: "Dulal Panda", name: "Molecular Cell Biology Lab", no: "401" },
  { floor: "4th", pi: "Deepak Agrawal", name: "Computational Medicine & Technology Lab", no: "402" },
  { floor: "4th", pi: "Sushil Kumar", name: "Precision Oncology Lab", no: "404" },
  { floor: "4th", pi: "Rajesh Patkar", name: "Metabolic Engineering Lab", no: "405" },
  { floor: "4th", pi: "Roop Mallick", name: "Motor Protein Lab", no: "406" },

  { floor: "5th", pi: "Swati Patankar", name: "Molecular Parasitology Lab", no: "502" },
  { floor: "5th", pi: "Sandeep Kaledhonkar", name: "Cryo-Electron Microscopy Lab", no: "504" },
  { floor: "5th", pi: "Rohit Srivastava", name: "Nano Bios Lab", no: "505" },

  { floor: "6th", pi: "Prakriti Tayalia", name: "Cell and Tissue Engineering Lab", no: "602" },
  { floor: "6th", pi: "Shamik Sen", name: "Cellular Biophysics Lab", no: "605" },
  { floor: "6th", pi: "Debjani Paul", name: "Microfluidics and Biological Physics Lab", no: "604" },
  { floor: "6th", pi: "Kiran Kondabagil", name: "Molecular Virology Lab", no: "601" },
  { floor: "6th", pi: "Prasenjit Bhaumik", name: "Protein Crystallography Lab", no: "603" },
];

export default function LabDirectory({ compact = false }) {
  return (
    <section className="lab-directory" aria-labelledby="lab-directory-title">
      <h3 id="lab-directory-title">Lab Directory</h3>
      <div className="lab-directory-wrapper">
        <table className="lab-directory-table">
          <thead>
            <tr>
              <th>Floor</th>
              <th>PI Name</th>
              <th>Lab Name</th>
              <th>Lab No</th>
            </tr>
          </thead>
          <tbody>
            {LABS.map((r, i) => (
              <tr key={i}>
                <td>{r.floor}</td>
                <td>{r.pi}</td>
                <td>{r.name}</td>
                <td>{r.no}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
