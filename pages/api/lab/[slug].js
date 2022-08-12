import db from "../../../utils/db";

export default async (req, res) => {
  try {
    const { slug } = req.query;
    const entries = await db.collection("lab");
    const snapshot = await entries.where("slug", "==", slug).get();

    const entriesData = snapshot.docs.map((entry) => entry.data());
    res.status(200).json(entriesData);
  } catch {
    console.log("ERROR");
  }
};
