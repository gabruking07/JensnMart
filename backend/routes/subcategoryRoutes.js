const express = require("express");
const router = express.Router();

const SubCategory = require("../models/SubCategory");
const authMiddleware = require("../middleware/authMiddleware");
const roleOnly = require("../middleware/adminOnly"); // ← fixed

/* CREATE */
router.post("/", authMiddleware, roleOnly(["admin","manager"]), async (req,res)=>{
  try{
    const { name, category } = req.body;

    if(!name || !category){
      return res.status(400).json({message:"Name & category required"});
    }

    const exists = await SubCategory.findOne({ name, category });
    if(exists){
      return res.status(400).json({message:"Subcategory exists"});
    }

    const sub = await SubCategory.create({ name, category });
    res.json(sub);
  }catch(err){
    res.status(500).json({message:"Create failed"});
  }
});

/* GET */
router.get("/", authMiddleware, async (req,res)=>{
  const data = await SubCategory.find()
    .populate("category","name")
    .sort({ name: 1 });

  res.json(data);
});

/* DELETE */
router.delete("/:id", authMiddleware, roleOnly("admin"), async (req,res)=>{
  await SubCategory.findByIdAndDelete(req.params.id);
  res.json({message:"Deleted"});
});

module.exports = router;