import React, { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import JournalCard from '../../components/Cards/JournalCard'
import { MdAdd, MdOutlineAlarmAdd } from 'react-icons/md'
import AddEditJournal from './AddEditJournal'
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../utils/axiosinstance'
import Toast from '../../components/ToastMessage/Toast'
import EmptyCard from '../../components/Cards/EmptyCard/EmptyCard'


const Home = () => {

    const [openAddEditJournal, setOpenAddEditJournal] = useState({
        isShown: false,
        type: "add",
        data: null,
    });

    const [showToastMsg, setShowToastMsg] = useState({
        isShown: false,
        type: "add",
        data: null,
    });

    const [userInfo, setUserInfo] = useState(null);
    const [allJournals, setAllJournals] = useState([]);

    const[isSearch, setIsSearch] = useState(false);

    const navigate = useNavigate();

    const handleEdit = (journalDetails) => {
        setOpenAddEditJournal({ isShown: true, data: journalDetails, type: "edit" });
    }

    const showToastMessage = (message, type) => {
        setShowToastMsg({
            isShown: true,
            message,
            type,
        });
    }

    const handleCloseToast = () => {
        setShowToastMsg({
            isShown: false,
            message: "",
        });
    }

    // Get User Info 
    const getUserInfo = async () => {
        try {
            const response = await axiosInstance.post("/get-user");
            if(response.data && response.data.user) {
                setUserInfo(response.data.user);
            }
        } catch (error) {
            if(error.response.status === 401) {
                localStorage.clear();
                navigate("/login");
            }
        }
    };

    // Get all journal 
    const getAllJournals = async () => {
        try {
            const response = await axiosInstance.get("/get-all-journals");

            if (response.data && response.data.journals) {
                setAllJournals(response.data.journals);
            }
        } catch (error) {
            console.log("An unexpected error occured. ")
        }
    }

    // Delete Journal
    const deleteJournal = async (data) => {
        const journalId = data._id

        try {
            const response = await axiosInstance.delete("/delete-journal/" + journalId);

            if (response.data && !response.data.error) {
                showToastMessage("Journal Deleted Successfully", 'delete')
                getAllJournals()
            }

        } catch (error) {
            if (
                error.response &&
                error.response.data &&
                error.response.data.message
            ) {
                console.log("An unexpected error occured. Please try again.")
            }
        }
    }

    const onSearchJournal = async (query) => {
        try {
            const response = await axiosInstance.get("/search-journal", {
                params: {query},
            });

            if (response.data && response.data.journal) {
                setIsSearch(true);
                setAllJournals(response.data.journal);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const updateIsPinned = async (journalData) => {
        const journalId = journalData._id

        try {
            const response = await axiosInstance.put("/update-journal-pinned/"+journalId, {
                isPinned: !journalData.isPinned,
            });

            if (response.data && response.data.journal) {
                showToastMessage("Journal updated successfully")
                getAllJournals();
            }
        }catch (error) {
          console.log(error)
        }
    }

    const handleClearSearch = () => {
        setIsSearch(false);
        getAllJournals();
    }

    useEffect(() => {
        getUserInfo();
        getAllJournals();
        return () => {};
    }, []);

    return (
        <>

        <Navbar userInfo={userInfo} onSearchJournal={onSearchJournal} handleClearSearch={handleClearSearch}/>

        <div className="container mx-auto">
            {allJournals.length > 0 ? (<div className="grid grid-cols-3 gap-4 mt-8">
                {allJournals.map((item, index) => (
                    <JournalCard 
                    key={item._id}
                    title={item.title} 
                    date={item.createdOn}
                    content={item.content}
                    tags={item.tags}
                    isPinned={item.isPinned}
                    onEdit={() => handleEdit(item)}
                    onDelete={() => deleteJournal(item)}
                    onPinJournal={() => updateIsPinned(item)}
                />
                ))}
            
            </div>) : (
                <EmptyCard message={isSearch ? `No Journals found` : `What's on your mind?`} />
            )}
        </div>

        <button className="w-16 h-16 flex items-center justify-center rounded-2xl bg-primary hover:bg-blue-600 hover:scale-105 transform transition-transform duration-200 absolute right-10 bottom-10" 
        onClick={() => {
            setOpenAddEditJournal({isShown:true, type:"add", data:null});
        }}
        >
            <MdAdd className="text-[32px] text-white"/>
        </button> 

        <Modal 
            isOpen={openAddEditJournal.isShown}
            onRequestClose={()=>{}}
            style={{
                overlay: {
                    backgroundColor: "rgba(0,0,0,0.2)",
                },
            }}
            contentLabel=""
            className="w-[40%] max-h-3/4 bg-white rounded-md mx-auto mt-14 p-5 overflow-scroll"
        >

        <AddEditJournal
            type={openAddEditJournal.type}
            journalData={openAddEditJournal.data}
            onClose={() => {
                setOpenAddEditJournal({ isShown: false, type: "add", data:null})
            }}
            getAllJournals={getAllJournals}
            showToastMessage={showToastMessage}
            /> 
        </Modal>

        <Toast 
            isShown={showToastMsg.isShown}
            message={showToastMsg.message}
            type={showToastMsg.type}
            onClose={handleCloseToast}
        />
        </>
    )
}

export default Home