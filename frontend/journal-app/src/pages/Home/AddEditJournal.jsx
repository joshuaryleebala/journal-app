import React, { useState } from 'react';
import TagInput from '../../components/Input/TagInput';
import { MdClose } from "react-icons/md"
import axiosInstance from '../../utils/axiosinstance';

const AddEditJournal = ({ journalData, type, getAllJournals, onClose, showToastMessage }) => {

    const [title, setTitle] = useState(journalData?.title || "");
    const [content, setContent] = useState(journalData?.content || "");
    const [tags, setTags] = useState(journalData?.tags || []);

    const [error, setError] = useState(null);

    const addNewJournal = async () => {
        try{
            const response = await axiosInstance.post("/add-journal", {
                title,
                content,
                tags,
            });

            if (response.data && response.data.journal) {
                showToastMessage("Journal Added Successfully")
                getAllJournals()
                onClose()
            }

        } catch (error) {
            if (
                error.response &&
                error.response.data && 
                error.response.data.message 
            ) {
                setError(error.response.data.message)
            }

        }
    };

    const editJournal = async () => {
        const journalId = journalData._id
        try { 
            const response = await axiosInstance.put("/edit-journal/" + journalId, {
                title,
                content,
                tags,
            });

            if (response.data && response.data.journal) {
                showToastMessage("Journal Updated Successfully")
                getAllJournals();
                onClose();
            }
        } catch (error) {
            if (
                error.response &&
                error.response.data && 
                error.response.data.message
            ) {
                setError(error.message.data.message);
            }
        }
    };


    const handleAddJournal = () => {
        if(!title) {
            setError("Please enter a title");
            return;
        }

        if(!content) {
            setError("Please tell me what's on your mind");
            return;
        }
        setError("");

        if(type=='edit'){
            editJournal()
        }else {
            addNewJournal()
        }
    }


    return (
        <div className="relative">

            <button className="w-8 h-8 rounded-full flex items-center justify-center absolute top-3 right-3 hover:bg-slate-100" 
                onClick={onClose}>
                <MdClose className="text-xl text-slate-400"/>
            </button>            

            <div className="flex flex-col gap-2">
                <label className="input-label">Title</label>
                <input 
                    type="text"
                    className="text-2xl text-slate-950 outline-none"
                    placeholder="Hello"
                    value={title}
                    onChange={({target}) => setTitle(target.value)}
                />
            </div>

            <div className="flex flex-col gap-2 mt-4">
                <label className="input-label">Content</label>
                <textarea 
                    type="text"
                    className="text-sm text-slate-950 outline-none bg-slate-50 p-2 rounded"
                    placeholder="What's on your mind?"
                    rows={10}
                    value={content}
                    onChange={({target}) => setContent(target.value)}
                />
            </div>

            <div className="mt-3">
                <label className="input-label">TAGS</label>
                <TagInput tags={tags} setTags={setTags}/>
            </div>

            {error && <p className="text-red-500 text-xs pt-4">{error}</p>}

            <button className="btn-primary font-medium mt-5 p-3" onClick={handleAddJournal}>
                {type === "edit" ? "UPDATE" : "ADD"}
            </button>
        </div>
    )
}

export default AddEditJournal 