import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../SearchBar/SearchBar';
import ProfileInfo from '../Cards/ProfileInfo';

const Navbar = ({ userInfo, onSearchJournal, handleClearSearch }) => {
    const [searchQuery, setSearchQuery] = useState("");

    const navigate = useNavigate();

    const onLogout = () => {
        localStorage.clear();
        navigate("/login");
    }

    const handleSearch = () => {
        if(searchQuery) {
            onSearchJournal(searchQuery)
        }
    }

    const onClearSearch = () => {
        setSearchQuery("")
        handleClearSearch();
    }

    return (
        <div className="bg-white flex items-center justify-between px-6 py-2 drop-shadow">
            <h2 className="text-xl font-medium text-blue-500 py-2">Diario</h2>

            <SearchBar value={searchQuery}
                onChange={({target}) => {
                    setSearchQuery(target.value)
                }}
                handleSearch={handleSearch}
                onClearSearch={onClearSearch}
                />

            <ProfileInfo userInfo={userInfo} onLogout={onLogout}/>

        </div>
    )
}

export default Navbar