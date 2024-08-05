import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token'),
  },
});

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    socket.on('private message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    const fetchMessages = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.post('http://localhost:5000/messages', { token });
        setMessages(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchMessages();

    return () => {
      socket.off('private message');
    };
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() && selectedUser) {
      let filePath = null;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const response = await axios.post('http://localhost:5000/upload', formData);
          filePath = response.data.filePath;
        } catch (error) {
          console.error(error);
        }
      }

      socket.emit('private message', { content: message, to: selectedUser, file: filePath });
      setMessages((prevMessages) => [...prevMessages, { content: message, from: 'Me', file: filePath }]);
      setMessage('');
      setFile(null);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/users');
      setUsers(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="chat-container">
      <h2>Chat</h2>
      <div className="user-list">
        {users.map((user, index) => (
          <div
            key={index}
            className={`user ${selectedUser === user.username ? 'selected' : ''}`}
            onClick={() => setSelectedUser(user.username)}
          >
            {user.username}
          </div>
        ))}
      </div>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            {msg.from}: {msg.content}
            {msg.file && (
              <div>
                <a href={`http://localhost:5000${msg.file}`} target="_blank" rel="noopener noreferrer">View File</a>
              </div>
            )}
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={sendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chat;
