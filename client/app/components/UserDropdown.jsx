"use client";
import { useState } from 'react';

const UserDropdown = ({ users, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="input input-md w-full bg-base-300 text-left flex items-center justify-between"
      >
        {searchTerm || 'Select user'}
        <i className={`fi fi-rr-chevron-${isOpen ? 'up' : 'down'} ml-2`}></i>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-base-100 border border-base-300 rounded-xl shadow-lg max-h-60 overflow-auto z-10">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-md w-full border-b border-base-300"
          />
          {filteredUsers.length ? (
            filteredUsers.map(user => (
              <div
                key={user.id}
                className="p-3 cursor-pointer hover:bg-base-300"
                onClick={() => {
                  onSelect(user);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center">
                  <img
                    src={user.profilePicture ?? 'profile.png'}
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <span>{user.name}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="p-3 text-center text-gray-600">No users found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
