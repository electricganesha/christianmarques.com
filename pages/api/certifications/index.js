import db from "../../../utils/db";

export default async (req, res) => {
  try {
    const snapshot = await db
      .collection("certifications")
      .orderBy("order", "asc")
      .get();
    const certifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(certifications);
  } catch (error) {
    console.error("Failed to fetch certifications from Firestore:", error);
    res.status(500).json({ error: "Failed to fetch certifications" });
  }
};
