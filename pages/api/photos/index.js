import db from "../../../utils/db";

export default async (req, res) => {
  try {
    const entries = await db.collection("photos").get();
    const entriesData = entries.docs.map((entry) => entry.data());
    res.status(200).json(
      entriesData.sort(function (a, b) {
        return new Date(a.date._seconds) - new Date(b.date._seconds);
      })
    );
  } catch {
    console.log("ERROR");
  }
};
