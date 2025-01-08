require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");

mongoose.connect(config.connectionString);

const User = require("./models/user.model")
const Journal = require("./models/journal.model")

const express = require("express");
const cors = require("cors");
const app = express();

const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./utilities")

app.use(express.json());

app.use(
    cors({
        origin:"*",
    })
);

app.get("/", (req, res) => {
    res.json({ data: "hello" });
});

app.post("/create-account", async (req, res) => {
    const { fullName, email, password } = req.body;

    if(!fullName) {
        return res
        .status(400)
        .json({ error:true, message: "Full Name is required" });
    }

    if(!email) {
        return res
        .status(400)
        .json({ error:true, message: "Email is required" });
    }

    if(!password) {
        return res
        .status(400)
        .json({ error:true, message: "Password is required" });
    }

    const isUser = await User.findOne({ email: email });

    if (isUser) {
        return res.json({ error:true, message:"User already exists" });
    }

    const user = new User({
        fullName,
        email,
        password,
    });

    await user.save();

    const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "36000m",
    });

    return res.json({
        error: false,
        user, 
        accessToken,
        message:"Registration Successful",
    });
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if(!email) {
        return res
        .status(400)
        .json({ message: "Email is required" });
    }

    if(!password) {
        return res
        .status(400)
        .json({ message: "Password is required" });
    }

    const userInfo = await User.findOne({ email: email });

    if(!userInfo) {
        return res.status(400).json({ message: "User not found" });
    }

    if (userInfo.email == email && userInfo.password == password) {
        const user = { user: userInfo };
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "36000m",
        });

        return res.json({
            error: false,
            message: "Login Successful",
            email, 
            accessToken,
        });
    } else {
        return res.status(400).json({
            error: true,
            message: "Invalid Credentials",
        });
    }
});

app.post("/get-user", authenticateToken, async (req, res) => {
    const { user } = req.user;
    
    const isUser = await User.findOne({ _id: user._id });

    if(!isUser) {
        return res.sendStatus(401);
    }

    return res.json({
        user: {
            fullName: isUser.fullName,
            email: isUser.email,
            _id: isUser._id,
            createdOn: isUser.createdOn,
        },
        message:""
    })
})

// Add Journal
app.post("/add-journal", authenticateToken, async (req, res) => {
    const { title, content, tags } = req.body;
    const { user } = req.user;

    if(!title) {
        return res.status(400).json({ error: true, message:"Title is required"});
    }

    if(!content) {
        return res.status(400).json({ error: true, message:"Content is required"});
    }

    try {
        const journal = new Journal({
            title,
            content,
            tags: tags || [],
            userId: user._id,
        });

        await journal.save();

        return res.json({
            error: false,
            journal,
            message: "Journal added successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message:"Internal Server Error",
        });
    }
});

app.put("/edit-journal/:journalId", authenticateToken, async (req, res) => {
    const journalId = req.params.journalId;
    const { title, content, tags, isPinned } = req.body;
    const { user } = req.user;

    if (!title && !content && !tags) {
        return res
        .status(400)
        .json({ error: true, message: "No changes provided" });
    }

    try {
        const journal = await Journal.findOne({ _id: journalId, userId: user._id });

        if(!journal){
            return res
            .status(404)
            .json({ error: true, message: "Journal not found"})
        }

        if (title) journal.title = title;
        if (content) journal.content = content;
        if (tags) journal.tags = tags;
        if (isPinned) journal.isPinned = isPinned;

        await journal.save();

        return res.json({
            error: false,
            journal,
            message: "Journal updated successfully"
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
})

app.get("/get-all-journals", authenticateToken, async (req, res) => {
    const { user } = req.user;

    try{
        const journals = await Journal.find({ userId: user._id }).sort({ isPinned: -1 });

        return res.json({
            error: false,
            journals,
            message: "All journals retrieved successfully",
        })
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error"
        })
    }
})

app.delete("/delete-journal/:journalId", authenticateToken, async (req, res) => {
    const { journalId } = req.params;
    const { user } = req.user;

    try {
        const result = await Journal.deleteOne({ _id: journalId, userId: user._id});

        if (result.deletedCount === 0) {
            return res.status(404)
            .json({ error: true, message: "Journal not found"});
        }

        return res.json({
            error: false,
            message: "Journal deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message:"Internal Server Error",
        })
    }
})

app.put("/update-journal-pinned/:journalId", authenticateToken, async (req, res) => {
    const journalId = req.params.journalId;
    const { isPinned } = req.body;
    const { user } = req.user;

    try {
        const journal = await Journal.findOne({ _id: journalId, userId: user._id });

        if(!journal) {
            return res.status(400)
            .json({ error: true, message: "Journal not found" });
        }

        journal.isPinned = isPinned || false;

        await journal.save();

        return res.json({
            error: false,
            journal,
            message: "Journal update successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
})

app.get("/search-journal", authenticateToken, async (req, res) => {
    const { user } = req.user;
    const { query } = req.query;

    if(!query) {
        return res
        .status(400)
        .json({ erro: true, message:"Search query is required" });
    }

    try{
        const matchingJournal = await Journal.find({
            userId: user._id,
            $or: [
                { title: { $regex: new RegExp(query, "i") } },
                { content: { $regex: new RegExp(query, "i") } },
            ],
        });

        return res.json({
            error: false,
            journal: matchingJournal,
            message: "Journals retrieved successfully",
        });

    } catch (error) {
        return res.status(500).json({
            error: true,
            message:"Internal Server Error",
        });
    }
});

app.listen(8000);

module.exports = app;