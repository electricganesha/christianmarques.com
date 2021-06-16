import db from "../../../utils/db";

export default async (req, res) => {
  try {
    const entries = await db.collection("poetry").get();
    const entriesData = entries.docs.map((entry) => entry.data());
    res.status(200).json(
      entriesData.sort(function (a, b) {
        return new Date(b.date._seconds) - new Date(a.date._seconds);
      })
    );
  } catch {
    console.log("ERROR");
  }
};
