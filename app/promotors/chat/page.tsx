"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Info, Send, Paperclip, Smile, Reply, Edit, Copy, Check, Heart, Trash2, MessageCircle, Image, FileText, RotateCw, Crop, Palette, X, Pen, Eraser, Pin, MessageCircleX, CircleDot, ArrowLeft, CheckSquare } from "lucide-react";

interface Contact {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  pinned?: boolean;
  markedUnread?: boolean;
  isGroup?: boolean;
  profileImage?: string | null;
  description?: string;
  members?: number[];
}

interface Message {
  id: number;
  sender: string;
  content: string;
  time: string;
  own: boolean;
  edited?: boolean;
  reaction?: string;
  photo?: string;
  pdf?: string;
  pdfName?: string;
  type?: string;
  replyTo?: {
    id: number;
    sender: string;
    content: string;
    photo?: string;
    pdf?: string;
    pdfName?: string;
  };
}

export default function PromotorChatPage() {
  const [selectedChat, setSelectedChat] = useState<Contact | null>(null);

  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem('isInChatMode', 'true');
    } else {
      localStorage.setItem('isInChatMode', 'false');
    }
    // Dispatch a custom event to notify the layout component immediately
    window.dispatchEvent(new Event("storage"));
    
    // Exit select mode when switching chats
    setIsSelectMode(false);
    setSelectedMessages(new Set());
  }, [selectedChat]);

  // Add CSS animations for select mode checkboxes
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .animate-slide-from-left {
        animation: slideFromLeft 0.3s ease-out;
      }
      
      .animate-slide-from-right {
        animation: slideFromRight 0.3s ease-out;
      }
      
      @keyframes slideFromLeft {
        from {
          transform: translateX(-20px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideFromRight {
        from {
          transform: translateX(20px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [messageInput, setMessageInput] = useState("");
  const [emojiPicker, setEmojiPicker] = useState<{ show: boolean; selectedCategory: string; context: 'input' | 'photo' | 'pdf' }>({ show: false, selectedCategory: 'smileys', context: 'input' });

  const [attachmentPopup, setAttachmentPopup] = useState(false);
  const [photoEditor, setPhotoEditor] = useState<{ show: boolean; image: string; caption: string; rotation: number; cropMode: boolean; crop: { x: number; y: number; width: number; height: number } | null } | null>(null);
  const [pdfEditor, setPdfEditor] = useState<{ show: boolean; file: File; caption: string } | null>(null);
  const [colorPalette, setColorPalette] = useState<{ show: boolean; selectedColor: string }>({ show: false, selectedColor: '' });
  const [eraserPalette, setEraserPalette] = useState<{ show: boolean; selectedSize: number }>({ show: false, selectedSize: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPaths, setDrawingPaths] = useState<Array<{ color: string; points: Array<{ x: number; y: number }> }>>([]);
  const [undoHistory, setUndoHistory] = useState<Array<{ 
    photoEditor: { show: boolean; image: string; caption: string; rotation: number; cropMode: boolean; crop: { x: number; y: number; width: number; height: number } | null } | null;
    drawingPaths: Array<{ color: string; points: Array<{ x: number; y: number }> }>;
  }>>([]);

  // Save current state to undo history
  const saveToHistory = () => {
    setUndoHistory(prev => [
      ...prev,
      {
        photoEditor: photoEditor ? { ...photoEditor, crop: photoEditor.crop ? { ...photoEditor.crop } : null } : null,
        drawingPaths: [...drawingPaths]
      }
    ]);
  };

  // Undo last change
  const undoLastChange = () => {
    if (undoHistory.length > 0) {
      const lastState = undoHistory[undoHistory.length - 1];
      setPhotoEditor(lastState.photoEditor);
      setDrawingPaths(lastState.drawingPaths);
      setUndoHistory(prev => prev.slice(0, -1));
    }
  };



  
  // Context menu for messages (long press on mobile)
  const [contextMenu, setContextMenu] = useState<{ show: boolean; x: number; y: number; messageId: number | null; isOwnMessage: boolean }>({
    show: false,
    x: 0,
    y: 0,
    messageId: null,
    isOwnMessage: false
  });
  
  // Long press handling
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Prevent immediate closing after context menu opens
  const [ignoreClickOutside, setIgnoreClickOutside] = useState(false);
  
  // Reply functionality
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [replyAnimation, setReplyAnimation] = useState<{ startY: number; endY: number } | null>(null);
  const [flashingMessageId, setFlashingMessageId] = useState<number | null>(null);
  
  // Edit functionality
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editAnimation, setEditAnimation] = useState<{ startY: number; endY: number } | null>(null);
  
  // Select functionality
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set());
  
  // Delete functionality
  const [deleteDialog, setDeleteDialog] = useState<{ 
    show: boolean; 
    messageId: number | null; 
    isOwnMessage: boolean;
    isBulkDelete: boolean;
    selectedMessageIds: number[];
    hasOwnMessages: boolean;
    hasOtherMessages: boolean;
  }>({
    show: false,
    messageId: null,
    isOwnMessage: false,
    isBulkDelete: false,
    selectedMessageIds: [],
    hasOwnMessages: false,
    hasOtherMessages: false
  });

  // Info menu functionality
  const [infoMenu, setInfoMenu] = useState<{
    show: boolean;
    selectedTab: 'fotos' | 'media';
  }>({
    show: false,
    selectedTab: 'fotos'
  });

  // Photo viewer functionality
  const [photoViewer, setPhotoViewer] = useState<{
    show: boolean;
    currentIndex: number;
    photos: string[];
  }>({
    show: false,
    currentIndex: 0,
    photos: []
  });

  // Contact context menu functionality
  const [contactContextMenu, setContactContextMenu] = useState<{ 
    show: boolean; 
    x: number; 
    y: number; 
    contactId: number | null;
  }>({
    show: false, 
    x: 0, 
    y: 0, 
    contactId: null
  });

  // Clear chat dialog functionality
  const [clearChatDialog, setClearChatDialog] = useState<{ 
    show: boolean; 
    contactId: number | null; 
  }>({
    show: false,
    contactId: null
  });

  // Contact long press timer
  const [contactLongPressTimer, setContactLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [longPressTriggered, setLongPressTriggered] = useState(false);

  // Emoji categories and data
  const emojiCategories = {
    smileys: {
      name: 'Smileys & People',
      emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😶‍🌫️', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐']
    },
    animals: {
      name: 'Animals & Nature',
      emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔']
    },
    food: {
      name: 'Food & Drink',
      emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🌶️', '🫒', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🫓', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦐', '🦑', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯']
    },
    activities: {
      name: 'Activities',
      emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♀️', '🏋️', '🏋️‍♂️', '🤼‍♀️', '🤼', '🤼‍♂️', '🤸‍♀️', '🤸', '🤸‍♂️', '⛹️‍♀️', '⛹️', '⛹️‍♂️', '🤺', '🤾‍♀️', '🤾', '🤾‍♂️', '🏌️‍♀️', '🏌️', '🏌️‍♂️', '🏇', '🧘‍♀️', '🧘', '🧘‍♂️', '🏄‍♀️', '🏄', '🏄‍♂️', '🏊‍♀️', '🏊', '🏊‍♂️', '🤽‍♀️', '🤽', '🤽‍♂️', '🚣‍♀️', '🚣', '🚣‍♂️', '🧗‍♀️', '🧗', '🧗‍♂️', '🚵‍♀️', '🚵', '🚵‍♂️', '🚴‍♀️', '🚴', '🚴‍♂️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🤹‍♂️', '🤹‍♀️', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🥁', '🪘', '🎹', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩']
    },
    travel: {
      name: 'Travel & Places',
      emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼', '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛰️', '🚊', '🚝', '🚅', '🚄', '🚈', '🚞', '🚋', '🚃', '🚟', '🚠', '🚡', '⛴️', '🛥️', '🚤', '⛵', '🛶', '🚣', '🛸', '🚢', '⚓', '⛽', '🚧', '🚨', '🚥', '🚦', '🛑', '🚏', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🛖', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛱️', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🎪']
    },
    objects: {
      name: 'Objects',
      emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪓', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🪆', '🖼️', '🪞', '🪟', '🛍️', '🛒', '🎁', '🎀', '🎊', '🎉', '🎈', '🎄', '🎃', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧', '🎀', '🎁', '🎗️', '🎟️', '🎫', '🎖️', '🏆', '🏅', '🥇', '🥈', '🥉']
    },
    symbols: {
      name: 'Symbols',
      emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', '🔤', '🔡', '🔠', '🔢', '🔣', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '🔤', '🔡', '🔠', '🔣', '🔽', '🔼', '⏸️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '🟰', '♾️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔉', '🔊', '🔇', '📢', '📣', '📯', '🔔', '🔕']
    }
  };

  // Mock contacts data
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: 1,
      name: "Lisa Müller",
      lastMessage: "Alles klar, bis später!",
      time: "14:32",
      unread: 2,
      online: true,
      pinned: false,
      profileImage: null
    },
    {
      id: 2,
      name: "Max Schmidt",
      lastMessage: "Die Zahlen sehen gut aus",
      time: "13:45",
      unread: 0,
      online: true,
      profileImage: null
    },
    {
      id: 3,
      name: "Anna Weber",
      lastMessage: "Danke für die Info!",
      time: "12:15",
      unread: 1,
      online: true,
      profileImage: null
    },
    {
      id: 4,
      name: "Tom Klein",
      lastMessage: "Wann ist das Meeting?",
      time: "11:30",
      unread: 0,
      online: true,
      profileImage: null
    },
    {
      id: 5,
      name: "Sarah Lange",
      lastMessage: "Perfekt, danke!",
      time: "10:22",
      unread: 0,
      online: false,
      profileImage: null
    },
    {
      id: 6,
      name: "Michael Braun",
      lastMessage: "Bis morgen früh!",
      time: "09:45",
      unread: 0,
      online: true,
      profileImage: null
    },
    {
      id: 7,
      name: "Julia Fischer",
      lastMessage: "Super Arbeit heute!",
      time: "09:12",
      unread: 3,
      online: false,
      profileImage: null
    },
    {
      id: 8,
      name: "David Hoffmann",
      lastMessage: "Können wir das besprechen?",
      time: "08:55",
      unread: 0,
      online: true,
      profileImage: null
    },
    {
      id: 9,
      name: "Nina Schulz",
      lastMessage: "Danke für deine Hilfe!",
      time: "08:30",
      unread: 1,
      online: true,
      profileImage: null
    },
    {
      id: 10,
      name: "Robert Wagner",
      lastMessage: "Alles erledigt ✓",
      time: "08:15",
      unread: 0,
      online: false,
      profileImage: null
    },
    {
      id: 11,
      name: "Sandra Meyer",
      lastMessage: "Guten Morgen!",
      time: "07:45",
      unread: 0,
      online: true,
      profileImage: null
    },
    {
      id: 12,
      name: "Christian Wolf",
      lastMessage: "Bis später!",
      time: "07:20",
      unread: 2,
      online: false,
      profileImage: null
    },
    {
      id: 13,
      name: "Petra Richter",
      lastMessage: "Verstanden, mache ich",
      time: "07:00",
      unread: 0,
      online: true,
      profileImage: null
    },
    {
      id: 14,
      name: "Marco Bauer",
      lastMessage: "Sehr gut!",
      time: "06:45",
      unread: 0,
      online: false,
      profileImage: null
    },
    {
      id: 15,
      name: "Sabine Koch",
      lastMessage: "Wir schaffen das!",
      time: "06:30",
      unread: 1,
      online: true,
      profileImage: null
    }
  ]);

  // Mock messages data
  const [allMessages, setAllMessages] = useState<Record<number, Message[]>>({
    1: [
      { id: 1, sender: "Lisa Müller", content: "Hallo! Wie läuft der heutige Einsatz?", time: "14:20", own: false },
      { id: 2, sender: "Du", content: "Sehr gut! Die Kunden sind heute sehr interessiert.", time: "14:25", own: true },
      { id: 3, sender: "Lisa Müller", content: "Das freut mich zu hören! 😊", time: "14:27", own: false },
      { id: 4, sender: "Du", content: "Ja, ich denke wir werden heute ein gutes Ergebnis erzielen.", time: "14:30", own: true },
      { id: 5, sender: "Lisa Müller", content: "Danke für die Infos!", time: "14:32", own: false },
      { id: 6, sender: "Du", content: "Gerne! Wie ist es denn bei dir gelaufen?", time: "14:35", own: true },
      { id: 7, sender: "Lisa Müller", content: "Auch sehr gut! Ich habe heute schon 3 Verkäufe abgeschlossen.", time: "14:36", own: false },
      { id: 8, sender: "Du", content: "Wow, das ist ja fantastisch! 👏", time: "14:37", own: true },
      { id: 9, sender: "Lisa Müller", content: "Ja, ich bin auch sehr zufrieden. Die neuen Schulungsunterlagen haben wirklich geholfen.", time: "14:38", own: false },
      { id: 10, sender: "Du", content: "Das ist super zu hören! Welche Unterlagen meinst du genau?", time: "14:39", own: true },
      { id: 11, sender: "Lisa Müller", content: "Die neuen Produktpräsentationen und die Einwandbehandlung. Sehr hilfreich!", time: "14:40", own: false },
      { id: 12, sender: "Du", content: "Perfekt! Ich sollte mir die auch nochmal anschauen.", time: "14:41", own: true },
      { id: 13, sender: "Lisa Müller", content: "Auf jeden Fall! Sie sind wirklich gut strukturiert und praxisnah.", time: "14:42", own: false },
      { id: 14, sender: "Du", content: "Danke für den Tipp! Ich werde sie mir heute Abend durchlesen.", time: "14:43", own: true },
      { id: 15, sender: "Lisa Müller", content: "Gerne! Lass mich wissen, wie du sie findest.", time: "14:44", own: false },
      { id: 16, sender: "Du", content: "Mache ich! Übrigens, hast du schon gehört wann das nächste Team-Meeting ist?", time: "14:45", own: true },
      { id: 17, sender: "Lisa Müller", content: "Ja, ich glaube es ist nächste Woche Donnerstag um 10 Uhr.", time: "14:46", own: false },
      { id: 18, sender: "Du", content: "Alright, dann trage ich es mir gleich in den Kalender ein.", time: "14:47", own: true },
      { id: 19, sender: "Lisa Müller", content: "Gute Idee! Ich freue mich schon darauf, alle wieder zu sehen.", time: "14:48", own: false },
      { id: 20, sender: "Du", content: "Ja, ich auch! Es ist immer schön, sich mit dem Team auszutauschen.", time: "14:49", own: true },
      { id: 21, sender: "Lisa Müller", content: "Absolut! So, ich muss jetzt weiter. Noch einen schönen Tag!", time: "14:50", own: false },
      { id: 22, sender: "Du", content: "Dir auch! Viel Erfolg noch bei deinen weiteren Terminen.", time: "14:51", own: true },
      { id: 23, sender: "Lisa Müller", content: "Danke! Alles klar, bis später!", time: "14:52", own: false }
    ],
    2: [
      { id: 1, sender: "Team Lead Michael", content: "Hallo alle zusammen!", time: "13:30", own: false },
      { id: 2, sender: "Du", content: "Hallo Michael!", time: "13:35", own: true },
      { id: 3, sender: "Team Lead Michael", content: "Meeting um 15:00 Uhr", time: "13:45", own: false }
    ],
    3: [
      { id: 1, sender: "Anna", content: "Hey Team! Wie geht's euch?", time: "11:45", own: false },
      { id: 2, sender: "Du", content: "Alles bestens hier! 👍", time: "12:00", own: true },
      { id: 3, sender: "Tom", content: "Bei mir auch, super Wetter heute!", time: "12:15", own: false },
      { id: 4, sender: "Anna", content: "Neue Kampagne ist live!", time: "12:20", own: false, type: "system" }
    ],
    4: [
      { id: 1, sender: "Lisa Hoffmann", content: "Hi! Hast du Zeit für einen kurzen Call?", time: "11:30", own: false },
      { id: 2, sender: "Du", content: "Ja, gerne! Wann passt es dir?", time: "11:40", own: true },
      { id: 3, sender: "Lisa Hoffmann", content: "In 10 Minuten?", time: "11:50", own: false },
      { id: 4, sender: "Du", content: "Perfect! 👍", time: "11:52", own: true },
      { id: 5, sender: "Lisa Hoffmann", content: "Bis morgen!", time: "11:55", own: false }
    ],
    5: [
      { id: 1, sender: "Support Team", content: "Willkommen im Support Chat!", time: "09:00", own: false, type: "system" },
      { id: 2, sender: "Du", content: "Hallo! Ich habe ein Problem mit der App.", time: "10:15", own: true },
      { id: 3, sender: "Support", content: "Gerne helfen wir dir! Was ist das Problem?", time: "10:20", own: false },
      { id: 4, sender: "Du", content: "Die Synchronisation funktioniert nicht richtig.", time: "10:25", own: true },
      { id: 5, sender: "Support", content: "Problem wurde gelöst ✅", time: "10:30", own: false }
    ]
  });

  // Refs for scroll behavior
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedChat) {
      scrollToBottom();
    }
  }, [selectedChat]);

  // Handle contact selection
  const handleContactSelect = (contact: Contact) => {
    setSelectedChat(contact);
  };

  // Handle back to contacts
  const handleBackToContacts = () => {
    setSelectedChat(null);
  };

  // Combine image with cropping, drawings and rotation
  const combineImageWithDrawings = async (
    imageUrl: string, 
    paths: Array<{ color: string; points: Array<{ x: number; y: number }> }> = [],
    rotation: number = 0,
    crop: { x: number; y: number; width: number; height: number } | null = null
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUrl);
        return;
      }
      const img = document.createElement('img');
      
      img.onload = () => {
        // Calculate final dimensions considering crop
        let finalWidth = img.width;
        let finalHeight = img.height;
        
        if (crop) {
          finalWidth = img.width * crop.width;
          finalHeight = img.height * crop.height;
        }
        
        // Handle rotation by swapping dimensions if needed
        if (rotation % 180 === 90) {
          canvas.width = finalHeight;
          canvas.height = finalWidth;
        } else {
          canvas.width = finalWidth;
          canvas.height = finalHeight;
        }
        
        // Apply rotation and cropping
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        
        if (crop) {
          // Draw cropped portion
          const sourceX = img.width * crop.x;
          const sourceY = img.height * crop.y;
          const sourceWidth = img.width * crop.width;
          const sourceHeight = img.height * crop.height;
          
          ctx.drawImage(
            img, 
            sourceX, sourceY, sourceWidth, sourceHeight,
            -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight
          );
        } else {
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
        }
        
        ctx.restore();
        
        // Calculate scaling factors for drawing paths
        const displayElement = document.getElementById('crop-image');
        let scaleX = 1;
        let scaleY = 1;
        
        if (displayElement) {
          const displayRect = displayElement.getBoundingClientRect();
          scaleX = img.width / displayRect.width;
          scaleY = img.height / displayRect.height;
        }
        
        // Draw all paths with proper scaling
        paths.forEach(path => {
          if (path.points.length > 1) {
            ctx.strokeStyle = path.color;
            ctx.lineWidth = 3 * Math.max(scaleX, scaleY); // Scale line width
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            
            const firstPoint = path.points[0];
            ctx.moveTo(firstPoint.x * scaleX, firstPoint.y * scaleY);
            
            path.points.slice(1).forEach(point => {
              ctx.lineTo(point.x * scaleX, point.y * scaleY);
            });
            
            ctx.stroke();
          }
        });
        
        resolve(canvas.toDataURL());
      };
      
      img.src = imageUrl;
    });
  };

  // Get all photos from current chat messages
  const getAllPhotosFromChat = () => {
    if (!selectedChat) return [];
    const chatMessages = allMessages[selectedChat.id] || [];
    return chatMessages
      .filter((msg: Message) => msg.photo)
      .map((msg: Message) => msg.photo!)
      .reverse(); // Most recent first
  };

  // Get all PDFs from current chat messages
  const getAllPdfsFromChat = () => {
    if (!selectedChat) return [];
    const chatMessages = allMessages[selectedChat.id] || [];
    return chatMessages
      .filter((msg: Message) => msg.pdf)
      .map((msg: Message) => ({ url: msg.pdf!, name: msg.pdfName || msg.pdf! }))
      .reverse(); // Most recent first
  };

  // Open photo viewer
  const openPhotoViewer = (photoUrl: string) => {
    const allPhotos = getAllPhotosFromChat();
    const currentIndex = allPhotos.indexOf(photoUrl);
    setPhotoViewer({
      show: true,
      currentIndex: currentIndex >= 0 ? currentIndex : 0,
      photos: allPhotos
    });
  };

  // Navigate photo viewer
  const navigatePhotoViewer = (direction: 'prev' | 'next') => {
    setPhotoViewer(prev => {
      let newIndex;
      if (direction === 'prev') {
        newIndex = prev.currentIndex > 0 ? prev.currentIndex - 1 : prev.photos.length - 1;
      } else {
        newIndex = prev.currentIndex < prev.photos.length - 1 ? prev.currentIndex + 1 : 0;
      }
      return { ...prev, currentIndex: newIndex };
    });
  };

  // Close photo viewer
  const closePhotoViewer = () => {
    setPhotoViewer({
      show: false,
      currentIndex: 0,
      photos: []
    });
  };

  // Handle long press context menu for contacts  
  const handleContactLongPressStart = (e: React.TouchEvent | React.MouseEvent, contactId: number) => {
    e.stopPropagation();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const timer = setTimeout(() => {
      const menuWidth = 200;
      const menuHeight = 160;
      let x = clientX;
      let y = clientY;
      
      // If menu would go off right edge, position it to the left of touch
      if (clientX + menuWidth > window.innerWidth) {
        x = clientX - menuWidth;
      }
      
      // If menu would go off bottom edge, position it above touch
      if (clientY + menuHeight > window.innerHeight) {
        y = clientY - menuHeight;
      }
      
      setContactContextMenu({
        show: true,
        x: x,
        y: y,
        contactId
      });
      
      // Clear the timer since menu is now open
      setContactLongPressTimer(null);
      
      // Prevent chat from opening on click
      setLongPressTriggered(true);
      
      // Temporarily ignore click outside events to prevent immediate closing
      setIgnoreClickOutside(true);
      setTimeout(() => {
        setIgnoreClickOutside(false);
        // Allow normal clicks again after menu interaction period
        setTimeout(() => setLongPressTriggered(false), 100);
      }, 1500);
    }, 1500);
    
    setContactLongPressTimer(timer);
  };

  const handleContactLongPressEnd = () => {
    if (contactLongPressTimer) {
      clearTimeout(contactLongPressTimer);
      setContactLongPressTimer(null);
    }
  };

  // Close contact context menu
  const closeContactContextMenu = () => {
    setContactContextMenu({ show: false, x: 0, y: 0, contactId: null });
    setIgnoreClickOutside(false);
    setLongPressTriggered(false);
  };

  // Handle message send
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!messageInput.trim() || !selectedChat) return;

    if (editingMessage) {
      // Edit existing message
      setAllMessages(prev => ({
        ...prev,
        [selectedChat.id]: (prev[selectedChat.id] || []).map(msg => 
          msg.id === editingMessage.id 
            ? { ...msg, content: messageInput.trim(), edited: true }
            : msg
        )
      }));
      setEditingMessage(null);
      setEditAnimation(null);
      // Clean up edit keyframe
      const existingEditStyle = document.getElementById('edit-keyframes');
      if (existingEditStyle) {
        existingEditStyle.remove();
      }
    } else {
      // Send new message
      const newMessage: Message = {
        id: Date.now(),
        sender: 'Du',
        content: messageInput.trim(),
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        own: true,
        ...(replyingTo && {
          replyTo: {
            id: replyingTo.id,
            sender: replyingTo.sender,
            content: replyingTo.content,
            photo: replyingTo.photo,
            pdf: replyingTo.pdf,
            pdfName: replyingTo.pdfName
          }
        })
      };

      setAllMessages(prev => ({
        ...prev,
        [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage]
      }));

      setReplyingTo(null);
      setReplyAnimation(null);
      
      // Clean up keyframe
      const existingStyle = document.getElementById('reply-keyframes');
      if (existingStyle) {
        existingStyle.remove();
      }
    }

    setMessageInput("");
    
    // Ensure scrolling happens after message is rendered
    setTimeout(() => {
      scrollToBottom();
    }, 50);
  };

  // Handle long press for context menu (mobile)
  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent, messageId: number, isOwn: boolean) => {
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const timer = setTimeout(() => {
      const menuWidth = 160;
      const menuHeight = 220;
      
      // Calculate position based on message type
      let x, y;
      
      if (isOwn) {
        // Own messages: bottom-right corner at touch position (opens to left)
        x = clientX - menuWidth;
        y = clientY - menuHeight;
      } else {
        // Received messages: bottom-left corner at touch position (opens to right)
        x = clientX;
        y = clientY - menuHeight;
      }
      
      // If menu would go off left edge, position it to the right of touch
      if (x < 0) {
        x = clientX;
      }
      
      // If menu would go off top edge, position it below touch
      if (y < 0) {
        y = clientY;
      }
      
      // If menu would go off right edge, keep it on left side
      if (clientX + menuWidth > window.innerWidth) {
        x = clientX - menuWidth;
      }
      
      // If menu would go off bottom edge, keep it above touch
      if (clientY + menuHeight > window.innerHeight) {
        y = clientY - menuHeight;
      }
      
      setContextMenu({
        show: true,
        x: x,
        y: y,
        messageId,
        isOwnMessage: isOwn
      });
      
      // Clear the timer since menu is now open
      setLongPressTimer(null);
      
      // Temporarily ignore click outside events to prevent immediate closing
      setIgnoreClickOutside(true);
      setTimeout(() => {
        setIgnoreClickOutside(false);
      }, 1500);
    }, 1500); // 1.5 seconds
    
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, messageId: null, isOwnMessage: false });
    setIgnoreClickOutside(false);
  };

  // Handle context actions
  const handleContextAction = (action: string) => {
    if (action === 'reply' && contextMenu.messageId && selectedChat) {
      const messageToReply = allMessages[selectedChat.id]?.find(msg => msg.id === contextMenu.messageId);
      if (messageToReply) {
        // Find the original message element
        const messageElement = document.querySelector(`[data-message-id="${contextMenu.messageId}"]`) as HTMLElement;
        if (messageElement) {
          const rect = messageElement.getBoundingClientRect();
          const chatAreaRect = messageElement.closest('.relative')?.getBoundingClientRect();
          
          if (chatAreaRect) {
            // Calculate the distance from original position to reply position
            const replyTargetY = chatAreaRect.height - 80; // Where reply bubble will be
            const originalY = rect.top - chatAreaRect.top;
            const startOffset = originalY - replyTargetY;
            
            // Create dynamic keyframe
            const keyframeName = `slide-to-reply-${contextMenu.messageId}`;
            const keyframes = `
              @keyframes ${keyframeName} {
                from { transform: translateY(${startOffset}px); opacity: 1; }
                to { transform: translateY(0px); opacity: 1; }
              }
            `;
            
            // Remove existing keyframe if any
            const existingStyle = document.getElementById('reply-keyframes');
            if (existingStyle) {
              existingStyle.remove();
            }
            
            // Add new keyframe
            const style = document.createElement('style');
            style.id = 'reply-keyframes';
            style.textContent = keyframes;
            document.head.appendChild(style);
            
            setReplyAnimation({ startY: startOffset, endY: 0 });
          }
        }
        setReplyingTo(messageToReply);
      }
    } else if (action === 'edit' && contextMenu.messageId && selectedChat) {
      const messageToEdit = allMessages[selectedChat.id]?.find(msg => msg.id === contextMenu.messageId);
      if (messageToEdit) {
        // Find the original message element
        const messageElement = document.querySelector(`[data-message-id="${contextMenu.messageId}"]`) as HTMLElement;
        if (messageElement) {
          const rect = messageElement.getBoundingClientRect();
          const chatAreaRect = messageElement.closest('.relative')?.getBoundingClientRect();
          
          if (chatAreaRect) {
            // Calculate the distance from original position to input field position
            const inputTargetY = chatAreaRect.height - 80; // Where input field is
            const originalY = rect.top - chatAreaRect.top;
            const startOffset = originalY - inputTargetY;
            
            // Create dynamic keyframe for edit animation
            const keyframeName = `slide-to-edit-${contextMenu.messageId}`;
            const keyframes = `
              @keyframes ${keyframeName} {
                from { transform: translateY(${startOffset}px); opacity: 1; }
                to { transform: translateY(0px); opacity: 1; }
              }
            `;
            
            // Remove existing keyframe if any
            const existingStyle = document.getElementById('edit-keyframes');
            if (existingStyle) {
              existingStyle.remove();
            }
            
            // Add new keyframe
            const style = document.createElement('style');
            style.id = 'edit-keyframes';
            style.textContent = keyframes;
            document.head.appendChild(style);
            
            setEditAnimation({ startY: startOffset, endY: 0 });
          }
        }
        setEditingMessage(messageToEdit);
        setMessageInput(messageToEdit.content);
      }
    } else if (action === 'copy' && contextMenu.messageId && selectedChat) {
      const messageToCopy = allMessages[selectedChat.id]?.find(msg => msg.id === contextMenu.messageId);
      if (messageToCopy) {
        navigator.clipboard.writeText(messageToCopy.content).catch(err => {
          console.error('Failed to copy message:', err);
        });
      }
    } else if (action === 'select') {
      setIsSelectMode(true);
      // Automatically select the message that was long-pressed
      if (contextMenu.messageId) {
        const newSelected = new Set(selectedMessages);
        newSelected.add(contextMenu.messageId);
        setSelectedMessages(newSelected);
      }
    } else if (action === 'delete' && contextMenu.messageId) {
      setDeleteDialog({ 
        show: true, 
        messageId: contextMenu.messageId, 
        isOwnMessage: contextMenu.isOwnMessage,
        isBulkDelete: false,
        selectedMessageIds: [],
        hasOwnMessages: false,
        hasOtherMessages: false
      });
    } else if (action.startsWith('react-') && contextMenu.messageId && selectedChat) {
      const emoji = action.split('react-')[1];
      setAllMessages(prev => ({
        ...prev,
        [selectedChat.id]: (prev[selectedChat.id] || []).map(msg => 
          msg.id === contextMenu.messageId 
            ? { 
                ...msg, 
                reaction: msg.reaction === emoji ? undefined : emoji // Toggle reaction
              }
            : msg
        )
      }));
    } else {
      // For other actions, just log for now (functionality will be added later)
      console.log('Context action:', action, 'for message:', contextMenu.messageId);
    }
    closeContextMenu();
  };

  // Handle click on replied-to message container
  const handleReplyClick = (messageId: number) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement;
    if (messageElement) {
      // Scroll to the message
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Flash the message after scroll completes with short pause
      setTimeout(() => {
        setFlashingMessageId(messageId);
        setTimeout(() => {
          setFlashingMessageId(null);
        }, 800); // Flash duration
      }, 400); // Wait for scroll to complete + short pause
    }
  };

  // Handle copying all selected messages
  const handleCopySelectedMessages = () => {
    if (!selectedChat || selectedMessages.size === 0) return;
    
    const messagesToCopy = allMessages[selectedChat.id]?.filter(msg => 
      selectedMessages.has(msg.id)
    ) || [];
    
    const copiedText = messagesToCopy
      .sort((a, b) => a.id - b.id) // Sort by message order
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');
    
    navigator.clipboard.writeText(copiedText).catch(err => {
      console.error('Failed to copy messages:', err);
    });
    
    // Exit select mode after copying
    setIsSelectMode(false);
    setSelectedMessages(new Set());
  };

  // Handle delete for me (remove message completely)
  const handleDeleteForMe = () => {
    if (deleteDialog.messageId && selectedChat) {
      setAllMessages(prev => ({
        ...prev,
        [selectedChat.id]: (prev[selectedChat.id] || []).filter(msg => msg.id !== deleteDialog.messageId)
      }));
      setDeleteDialog({ 
        show: false, 
        messageId: null, 
        isOwnMessage: false,
        isBulkDelete: false,
        selectedMessageIds: [],
        hasOwnMessages: false,
        hasOtherMessages: false
      });
    }
  };

  // Handle delete for everyone (change content to "Nachricht gelöscht...")
  const handleDeleteForEveryone = () => {
    if (deleteDialog.messageId && selectedChat) {
      setAllMessages(prev => ({
        ...prev,
        [selectedChat.id]: (prev[selectedChat.id] || []).map(msg => 
          msg.id === deleteDialog.messageId 
            ? { ...msg, content: 'Nachricht gelöscht...', edited: false }
            : msg
        )
      }));
      setDeleteDialog({ 
        show: false, 
        messageId: null, 
        isOwnMessage: false,
        isBulkDelete: false,
        selectedMessageIds: [],
        hasOwnMessages: false,
        hasOtherMessages: false
      });
    }
  };

  // Handle deleting selected messages with appropriate dialog
  const handleDeleteSelectedMessages = () => {
    if (!selectedChat || selectedMessages.size === 0) return;
    
    const messagesToDelete = allMessages[selectedChat.id]?.filter(msg => 
      selectedMessages.has(msg.id)
    ) || [];
    
    const hasOwnMessages = messagesToDelete.some(msg => msg.own);
    const hasOtherMessages = messagesToDelete.some(msg => !msg.own);
    
    setDeleteDialog({ 
      show: true, 
      messageId: null, 
      isOwnMessage: false,
      isBulkDelete: true,
      selectedMessageIds: Array.from(selectedMessages),
      hasOwnMessages,
      hasOtherMessages
    });
  };

  // Close context menu and other popups
  const handleClickOutside = (e: MouseEvent) => {
    // Don't handle click outside events if we're in the ignore period
    if (ignoreClickOutside) {
      return;
    }
    
    const target = e.target as HTMLElement;
    if (!target.closest('[data-context-menu]') && !target.closest('[data-emoji-picker]') && !target.closest('[data-emoji-trigger]') && !target.closest('[data-attachment-popup]') && !target.closest('[data-attachment-trigger]') && !target.closest('[data-photo-editor]') && !target.closest('[data-pdf-editor]') && !target.closest('[data-color-palette]') && !target.closest('[data-eraser-palette]')) {
      closeContextMenu();
      setEmojiPicker({ show: false, selectedCategory: 'smileys', context: 'input' });
      setAttachmentPopup(false);
      setColorPalette({ show: false, selectedColor: '' });
      setEraserPalette({ show: false, selectedSize: 0 });
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [ignoreClickOutside]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeContextMenu();
      setEmojiPicker({ show: false, selectedCategory: 'smileys', context: 'input' });
      setAttachmentPopup(false);
      setPhotoEditor(null);
      setPdfEditor(null);
      setColorPalette({ show: false, selectedColor: '' });
      setEraserPalette({ show: false, selectedSize: 0 });
      setDrawingPaths([]);
      
      // Cancel reply
      if (replyingTo) {
        setReplyingTo(null);
        setReplyAnimation(null);
        // Clean up keyframe
        const existingStyle = document.getElementById('reply-keyframes');
        if (existingStyle) {
          existingStyle.remove();
        }
      }
      
      // Cancel edit
      if (editingMessage) {
        setEditingMessage(null);
        setEditAnimation(null);
        setMessageInput("");
        // Clean up edit keyframe
        const existingEditStyle = document.getElementById('edit-keyframes');
        if (existingEditStyle) {
          existingEditStyle.remove();
        }
      }
      
      // Exit select mode
      if (isSelectMode) {
        setIsSelectMode(false);
        setSelectedMessages(new Set());
      }
      
      // Close delete dialog
      if (deleteDialog.show) {
        setDeleteDialog({ 
          show: false, 
          messageId: null, 
          isOwnMessage: false,
          isBulkDelete: false,
          selectedMessageIds: [],
          hasOwnMessages: false,
          hasOtherMessages: false
        });
      }
      
      // Close info menu
      if (infoMenu.show) {
        setInfoMenu(prev => ({ ...prev, show: false }));
      }
      
      // Close photo viewer
      if (photoViewer.show) {
        closePhotoViewer();
      }
      
      // Close contact context menu
      if (contactContextMenu.show) {
        closeContactContextMenu();
      }
      
      // Close clear chat dialog
      if (clearChatDialog.show) {
        setClearChatDialog({ show: false, contactId: null });
      }
      
      // Cancel any ongoing long press
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      
      // Cancel contact long press
      if (contactLongPressTimer) {
        clearTimeout(contactLongPressTimer);
        setContactLongPressTimer(null);
      }
      
      // Reset long press flag
      setLongPressTriggered(false);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dedicated click outside handler for emoji picker
  useEffect(() => {
    const handleEmojiClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (emojiPicker.show && !target.closest('[data-emoji-picker]') && !target.closest('[data-emoji-trigger]')) {
        setEmojiPicker({ show: false, selectedCategory: 'smileys', context: 'input' });
      }
    };

    document.addEventListener('click', handleEmojiClickOutside);
    return () => document.removeEventListener('click', handleEmojiClickOutside);
  }, [emojiPicker.show]);

  // Click outside handler for info menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (infoMenu.show) {
        const target = event.target as Element;
        const infoMenuContainer = target.closest('[data-info-menu]');
        if (!infoMenuContainer) {
          setInfoMenu(prev => ({ ...prev, show: false }));
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [infoMenu.show]);

  // Click outside handler for contact context menu
  useEffect(() => {
    const handleContactClickOutside = (event: MouseEvent) => {
      if (contactContextMenu.show && !ignoreClickOutside) {
        const target = event.target as Element;
        const contactMenuContainer = target.closest('[data-contact-context-menu]');
        if (!contactMenuContainer) {
          closeContactContextMenu();
        }
      }
    };

    document.addEventListener('mousedown', handleContactClickOutside);
    return () => document.removeEventListener('mousedown', handleContactClickOutside);
  }, [contactContextMenu.show, ignoreClickOutside]);

  // Sort contacts: pinned first, then by time
  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });



  return (
    <div className="fixed inset-0 bg-gray-50/30 z-10" style={{ margin: '0 !important', padding: '0 !important' }}>
      <style jsx>{`
        @keyframes slideUpFromBottom {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>


      {/* Main Content */}
      <div className="absolute inset-0 flex bg-gray-50">
        
        {selectedChat ? (
          /* Mobile Chat View */
          <div className="absolute inset-0 flex flex-col bg-gray-50">
            {/* Chat Header */}
            <div 
              className="bg-white text-gray-800 p-4 pt-20 flex items-center justify-between relative border-b border-gray-200"
              style={{
                boxShadow: 'inset 20px 0 30px -20px rgba(0,0,0,0.15)'
              }}
            >
              <div className="flex items-center">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="mr-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                
                <div className="relative">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                    {selectedChat.profileImage ? (
                      <img 
                        src={selectedChat.profileImage} 
                        alt={selectedChat.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-medium">{selectedChat.name.charAt(0)}</span>
                    )}
                  </div>
                  {selectedChat.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold text-gray-900">{selectedChat.name}</h2>
                  <p className="text-sm text-gray-600">
                    {selectedChat.online ? 'online' : 'zuletzt online'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isSelectMode && (
                  <>
                    <Copy 
                      className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-800" 
                      onClick={handleCopySelectedMessages}
                    />
                    <Trash2 
                      className="h-5 w-5 text-red-600 cursor-pointer hover:text-red-800" 
                      onClick={handleDeleteSelectedMessages}
                    />
                  </>
                )}
                <div className="relative" data-info-menu>
                  <button 
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={() => setInfoMenu(prev => ({ ...prev, show: !prev.show }))}
                  >
                    <Info className="h-5 w-5" />
                  </button>
                  
                  {/* Info Menu Dropdown */}
                  {infoMenu.show && (
                    <div 
                      className="absolute top-8 right-0 rounded-lg shadow-lg border border-gray-200 z-50"
                      style={{ 
                        width: '280px', 
                        minHeight: '300px',
                        backgroundColor: 'rgba(255, 255, 255, 0.97)'
                      }}
                    >
                      {/* Menu Header */}
                      <div className="flex border-b border-gray-100 relative">
                        <button
                          onClick={() => setInfoMenu(prev => ({ ...prev, selectedTab: 'fotos' }))}
                          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                            infoMenu.selectedTab === 'fotos'
                              ? 'text-transparent'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                          style={infoMenu.selectedTab === 'fotos' ? {
                            background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          } : {}}
                        >
                          Fotos
                        </button>
                        <button
                          onClick={() => setInfoMenu(prev => ({ ...prev, selectedTab: 'media' }))}
                          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                            infoMenu.selectedTab === 'media'
                              ? 'text-transparent'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                          style={infoMenu.selectedTab === 'media' ? {
                            background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          } : {}}
                        >
                          Media
                        </button>
                        {/* Sliding underline */}
                        <div 
                          className="absolute bottom-0 h-0.5 transition-all duration-300 ease-in-out"
                          style={{
                            background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
                            width: '50%',
                            transform: infoMenu.selectedTab === 'fotos' ? 'translateX(0)' : 'translateX(100%)'
                          }}
                        />
                      </div>
                      
                      {/* Menu Content */}
                      <div className="p-4">
                        {infoMenu.selectedTab === 'fotos' && (
                          <>
                            {getAllPhotosFromChat().length > 0 ? (
                              <div 
                                className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                              >
                                <div className="grid grid-cols-3 gap-2">
                                  {getAllPhotosFromChat().map((photo, index) => (
                                    <button
                                      key={index}
                                      onClick={() => {
                                        openPhotoViewer(photo);
                                        setInfoMenu(prev => ({ ...prev, show: false }));
                                      }}
                                      className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                                    >
                                      <img
                                        src={photo}
                                        alt={`Photo ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 py-8">
                                <p>Keine Fotos vorhanden</p>
                              </div>
                            )}
                          </>
                        )}
                        
                        {infoMenu.selectedTab === 'media' && (
                          <>
                            {getAllPdfsFromChat().length > 0 ? (
                              <div 
                                className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                              >
                                <div className="grid grid-cols-3 gap-2">
                                  {getAllPdfsFromChat().map((pdf, index) => (
                                    <div
                                      key={index}
                                      className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer flex flex-col items-center justify-center p-2"
                                      onClick={() => {
                                        window.open(pdf.url, '_blank');
                                        setInfoMenu(prev => ({ ...prev, show: false }));
                                      }}
                                    >
                                      <div className="flex-1 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-red-500" />
                                      </div>
                                      <div className="text-xs text-gray-700 text-center truncate w-full mt-1">
                                        {pdf.name}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 py-8">
                                <p>Keine Medien vorhanden</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              className="flex-1 overflow-y-auto pt-4 px-4 pb-24 [&::-webkit-scrollbar]:hidden"
              style={{
                boxShadow: 'inset 20px 0 30px -20px rgba(0,0,0,0.15)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                backgroundImage: `
                  radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)
                `,
                backgroundSize: '20px 20px'
              }}
            >
              <div className="space-y-4">
                {selectedChat && allMessages[selectedChat.id]?.map((message, index) => {
                  // Create fake dates for demonstration - different dates based on message groups
                  const getFakeDate = (msgIndex: number) => {
                    if (msgIndex < 5) return '2024-01-15';
                    if (msgIndex < 10) return '2024-01-16'; 
                    if (msgIndex < 15) return '2024-01-17';
                    return '2024-01-18';
                  };
                  
                  const currentDate = getFakeDate(index);
                  const previousDate = index > 0 ? getFakeDate(index - 1) : null;
                  const showDateSeparator = index === 0 || currentDate !== previousDate;

                  return (
                    <React.Fragment key={`fragment-${message.id}`}>
                      {/* Date Separator */}
                      {showDateSeparator && (
                        <div className="flex justify-center my-4">
                          <div className="bg-gray-100 rounded-full px-3 py-1 opacity-60">
                            <span className="text-xs text-gray-500">
                              {new Date(currentDate).toLocaleDateString('de-DE', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Message */}
                      {message.type === "system" ? (
                        // System Message Card (like date separator)
                        <div className="flex justify-center my-4">
                          <div className="bg-gray-100 rounded-full px-3 py-1 opacity-60">
                            <span className="text-xs text-gray-500">
                              {message.content}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={message.id}
                          className={`flex items-center ${message.own ? 'justify-end' : 'justify-start'} transition-all duration-300 ease-out ${
                            replyingTo?.id === message.id || editingMessage?.id === message.id ? 'opacity-0' : ''
                          }`}
                          data-message-id={message.id}
                        >
                          {/* Checkbox for received messages (left side) */}
                          {isSelectMode && !message.own && (
                            <div className="flex items-center animate-slide-from-left">
                              <div
                                onClick={() => {
                                  const newSelected = new Set(selectedMessages);
                                  if (selectedMessages.has(message.id)) {
                                    newSelected.delete(message.id);
                                  } else {
                                    newSelected.add(message.id);
                                  }
                                  setSelectedMessages(newSelected);
                                }}
                                className="mr-2 h-4 w-4 rounded-lg cursor-pointer flex items-center justify-center"
                                style={{
                                  background: selectedMessages.has(message.id) 
                                    ? 'linear-gradient(135deg, #3B82F6, #1E40AF)' 
                                    : 'white',
                                  border: '2px solid #3B82F6'
                                }}
                              >
                                {selectedMessages.has(message.id) && (
                                  <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                                )}
                              </div>
                            </div>
                          )}

                          <div
                            className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.own
                                ? 'text-white'
                                : 'bg-white text-gray-800 border border-gray-200'
                            }`}
                            style={{
                              ...(message.own ? {background: 'linear-gradient(135deg, #3B82F6, #1E40AF)'} : {opacity: 0.8}),
                              boxShadow: flashingMessageId === message.id
                                ? '0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.8)'
                                : message.own
                                  ? '0 2px 6px rgba(30, 64, 175, 0.6)'
                                  : '0 2px 6px rgba(0,0,0,0.12)',
                              transition: 'box-shadow 0.3s ease-in-out',
                              ...(isSelectMode ? { cursor: 'pointer' } : {})
                            }}
                            onTouchStart={(e) => !isSelectMode && handleLongPressStart(e, message.id, message.own)}
                            onTouchEnd={!isSelectMode ? handleLongPressEnd : undefined}
                            onTouchCancel={!isSelectMode ? handleLongPressEnd : undefined}
                            onMouseDown={(e) => !isSelectMode && handleLongPressStart(e, message.id, message.own)}
                            onMouseUp={!isSelectMode ? handleLongPressEnd : undefined}
                            onMouseLeave={!isSelectMode ? handleLongPressEnd : undefined}
                            onClick={() => {
                              if (isSelectMode) {
                                const newSelected = new Set(selectedMessages);
                                if (selectedMessages.has(message.id)) {
                                  newSelected.delete(message.id);
                                } else {
                                  newSelected.add(message.id);
                                }
                                setSelectedMessages(newSelected);
                              }
                            }}
                          >
                            {/* Reply Display */}
                            {message.replyTo && (
                              <div 
                                className="mt-2 mb-2 p-2 rounded border cursor-pointer"
                                style={{ 
                                  backgroundColor: 'rgba(255,255,255,0.08)',
                                  borderColor: 'rgba(255,255,255,0.20)' 
                                }}
                                onClick={() => handleReplyClick(message.replyTo!.id)}
                              >
                                {message.replyTo.photo ? (
                                  <div className="flex justify-between">
                                    <div className="flex-1 pr-2">
                                      <p className={`text-xs font-medium ${message.own ? 'text-blue-100' : 'text-gray-600'} opacity-50`}>
                                        {message.replyTo.sender}
                                      </p>
                                      {message.replyTo.content && (
                                        <p className={`text-xs mt-1 ${message.own ? 'text-blue-50' : 'text-gray-700'}`}
                                           style={{ 
                                             hyphens: 'auto',
                                             wordBreak: 'break-word',
                                             overflowWrap: 'break-word',
                                             overflow: 'hidden',
                                             display: '-webkit-box',
                                             WebkitLineClamp: 1,
                                             WebkitBoxOrient: 'vertical'
                                           }}>
                                          {message.replyTo.content}
                                        </p>
                                      )}
                                    </div>
                                    <img 
                                      src={message.replyTo.photo} 
                                      alt="Reply photo" 
                                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                                    />
                                  </div>
                                ) : message.replyTo.pdf ? (
                                  <div className="flex justify-between">
                                    <div className="flex-1 pr-2">
                                      <p className={`text-xs font-medium ${message.own ? 'text-blue-100' : 'text-gray-600'} opacity-50`}>
                                        {message.replyTo.sender}
                                      </p>
                                      <p className={`text-xs mt-1 ${message.own ? 'text-blue-50' : 'text-gray-700'}`}
                                         style={{ 
                                           hyphens: 'auto',
                                           wordBreak: 'break-word',
                                           overflowWrap: 'break-word',
                                           overflow: 'hidden',
                                           display: '-webkit-box',
                                           WebkitLineClamp: 1,
                                           WebkitBoxOrient: 'vertical'
                                         }}>
                                        {message.replyTo.pdfName || message.replyTo.pdf}
                                      </p>
                                    </div>
                                    <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center flex-shrink-0">
                                      <FileText className="w-4 h-4 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className={`text-xs font-medium ${message.own ? 'text-blue-100' : 'text-gray-600'} opacity-50`}>
                                      {message.replyTo.sender}
                                    </p>
                                    <p className={`text-xs mt-1 ${message.own ? 'text-blue-50' : 'text-gray-700'} ${message.replyTo.content === 'Nachricht gelöscht...' ? 'italic opacity-60' : ''}`} 
                                       style={{ 
                                         wordBreak: 'break-word',
                                         overflow: 'hidden',
                                         display: '-webkit-box',
                                         WebkitLineClamp: 2,
                                         WebkitBoxOrient: 'vertical'
                                       }}>
                                      {message.replyTo.content}
                                    </p>
                                  </>
                                )}
                              </div>
                            )}
                            
                            {/* Photo Display */}
                            {message.photo && (
                              <div className="mt-2 mb-2">
                                <img
                                  src={message.photo}
                                  alt="Shared photo"
                                  className="w-full h-auto rounded-lg cursor-pointer"
                                  style={{ 
                                    maxHeight: '300px',
                                    minHeight: '120px',
                                    objectFit: 'cover',
                                    aspectRatio: 'auto'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPhotoViewer(message.photo!);
                                  }}
                                />
                              </div>
                            )}

                            {/* PDF Display */}
                            {message.pdf && (
                              <div 
                                className="mt-2 mb-2 rounded-lg p-3 flex items-center space-x-3 cursor-pointer transition-colors hover:bg-gray-100"
                                style={{ 
                                  backgroundColor: 'rgba(255,255,255,0.5)',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(message.pdf, '_blank');
                                }}
                              >
                                <div className="w-10 h-12 bg-red-500 rounded flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {message.pdfName || message.pdf}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    PDF-Dokument
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Text Content */}
                            {message.content && (
                              <p 
                                className="text-sm"
                                style={{ 
                                  hyphens: 'auto',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word'
                                }}
                              >
                                {message.content}
                              </p>
                            )}
                            
                            {/* Message Meta */}
                            <div className="flex items-center justify-end mt-1 space-x-1">
                              {message.edited && (
                                <span className={`text-xs ${message.own ? 'text-blue-200' : 'text-gray-400'} opacity-70`}>
                                  bearbeitet
                                </span>
                              )}
                              <span className={`text-xs ${message.own ? 'text-blue-200' : 'text-gray-500'}`}>
                                {message.time}
                              </span>
                            </div>
                            
                            {/* Reaction Emoji */}
                            {message.reaction && (
                              <div 
                                className={`absolute ${message.own ? 'left-2' : 'right-2'} bg-white rounded-full border border-gray-200 shadow-sm`}
                                style={{
                                  bottom: '-13px',
                                  transform: 'translate(0, 0)',
                                  zIndex: 10
                                }}
                              >
                                <span className="text-sm px-1.5 py-0.5 block leading-none">
                                  {message.reaction}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Checkbox for own messages (right side) */}
                          {isSelectMode && message.own && (
                            <div className="flex items-center animate-slide-from-right">
                              <div
                                onClick={() => {
                                  const newSelected = new Set(selectedMessages);
                                  if (selectedMessages.has(message.id)) {
                                    newSelected.delete(message.id);
                                  } else {
                                    newSelected.add(message.id);
                                  }
                                  setSelectedMessages(newSelected);
                                }}
                                className="ml-2 h-4 w-4 rounded-lg cursor-pointer flex items-center justify-center"
                                style={{
                                  background: selectedMessages.has(message.id) 
                                    ? 'linear-gradient(135deg, #3B82F6, #1E40AF)' 
                                    : 'white',
                                  border: '2px solid #3B82F6'
                                }}
                              >
                                {selectedMessages.has(message.id) && (
                                  <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <form className={`absolute bottom-4 left-4 right-4 ${deleteDialog.show ? 'z-30' : 'z-50'}`} onSubmit={handleSendMessage} style={{ background: 'none' }}>
              <input 
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Nachricht eingeben..." 
                className={`w-full pl-12 pr-20 py-3 rounded-full outline-none text-gray-900 placeholder:text-gray-500 placeholder:text-sm transition-all duration-300 ${deleteDialog.show ? 'pointer-events-none' : ''}`}
                style={{ 
                  border: 'none', 
                  boxShadow: '0 3px 8px rgba(0,0,0,0.18)', 
                  WebkitAppearance: 'none', 
                  MozAppearance: 'none', 
                  appearance: 'none',
                  background: 'linear-gradient(to right, rgba(250,250,250,0.95), rgba(240,240,240,0.95))',
                  opacity: deleteDialog.show ? 0.3 : 0.85,
                  filter: deleteDialog.show ? 'blur(2px) brightness(0.6)' : 'none'
                }}
              />
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${deleteDialog.show ? 'opacity-30 pointer-events-none' : ''}`}>
                <Paperclip 
                  data-attachment-trigger
                  className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-800" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setAttachmentPopup(!attachmentPopup);
                  }}
                />
              </div>
              <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2 transition-all duration-300 ${deleteDialog.show ? 'opacity-30 pointer-events-none' : ''}`}>
                <Smile 
                  data-emoji-trigger
                  className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-800" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEmojiPicker(prev => ({ ...prev, show: !prev.show, context: 'input' }));
                  }}
                />
                <button 
                  type="submit"
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{background: 'linear-gradient(135deg, #3B82F6, #1E40AF)'}}
                >
                  <Send className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </form>

            {/* Emoji Picker */}
            {emojiPicker.show && (
              <div 
                data-emoji-picker
                className="absolute bg-white rounded-lg shadow-lg border border-gray-200 z-40"
                style={{
                  bottom: emojiPicker.context === 'input' ? '71px' : '96px',
                  left: '16px',
                  right: '16px',
                  height: '160px',
                  boxShadow: '0 -4px 25px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(0)',
                  transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
                  animation: 'slideUpFromBottom 0.3s ease-out'
                }}
              >
                {/* Emoji Grid */}
                <div className="h-full flex flex-col">
                  <div 
                    className="flex-1 p-3"
                    style={{
                      overflowY: 'auto',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    <div className="grid grid-cols-8 gap-1 [&::-webkit-scrollbar]:hidden" style={{ height: 'fit-content' }}>
                      {emojiCategories[emojiPicker.selectedCategory as keyof typeof emojiCategories]?.emojis.map((emoji, index) => (
                        <button
                          key={index}
                          className="text-xl p-1.5 rounded hover:bg-gray-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (emojiPicker.context === 'photo') {
                              setPhotoEditor(prev => prev ? { ...prev, caption: prev.caption + emoji } : null);
                            } else if (emojiPicker.context === 'pdf') {
                              setPdfEditor(prev => prev ? { ...prev, caption: prev.caption + emoji } : null);
                            } else {
                              setMessageInput(prev => prev + emoji);
                            }
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Category Footer */}
                  <div className="border-t border-gray-200 p-1 bg-gray-50 rounded-b-lg">
                    <div className="flex justify-around">
                      {Object.entries(emojiCategories).map(([key, category]) => (
                        <button
                          key={key}
                          className={`p-1.5 rounded transition-colors ${
                            emojiPicker.selectedCategory === key 
                              ? 'bg-gray-300 text-gray-700' 
                              : 'hover:bg-gray-200 text-gray-600'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmojiPicker(prev => ({ ...prev, selectedCategory: key }));
                          }}
                          title={category.name}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            {key === 'smileys' && (
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                            )}
                            {key === 'animals' && (
                              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM4 8a1 1 0 000 2h1a1 1 0 100-2H4zm0 4a1 1 0 100 2h1a1 1 0 100-2H4zm4-4a1 1 0 000 2h1a1 1 0 100-2H8zm0 4a1 1 0 100 2h1a1 1 0 100-2H8z" />
                            )}
                            {key === 'food' && (
                              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                            )}
                            {key === 'activities' && (
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            )}
                            {key === 'travel' && (
                              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            )}
                            {key === 'objects' && (
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                            )}
                            {key === 'symbols' && (
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            )}
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Context Menu */}
            {contextMenu.show && (
              <div
                data-context-menu
                className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-100"
                style={{
                  left: contextMenu.x,
                  top: contextMenu.y,
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(10px)',
                  minWidth: '160px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => handleContextAction('reply')}
                  >
                    <Reply className="h-4 w-4" />
                    <span>Antworten</span>
                  </button>
                  <hr className="border-gray-100 opacity-50" />
                  {contextMenu.isOwnMessage && (
                    <>
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        onClick={() => handleContextAction('edit')}
                      >
                        <Edit className="h-4 w-4" />
                        <span>Bearbeiten</span>
                      </button>
                      <hr className="border-gray-100 opacity-50" />
                    </>
                  )}
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => handleContextAction('copy')}
                  >
                    <Copy className="h-4 w-4" />
                    <span>Kopieren</span>
                  </button>
                  <hr className="border-gray-100 opacity-50" />
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => handleContextAction('select')}
                  >
                    <Check className="h-4 w-4" />
                    <span>Auswählen</span>
                  </button>
                  <hr className="border-gray-100 opacity-50" />
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    onClick={() => handleContextAction('delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Löschen</span>
                  </button>
                  <hr className="border-gray-100 opacity-50" />
                  <div className="w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center justify-center space-x-3">
                    <span 
                      className="text-lg hover:scale-125 transition-transform duration-150 cursor-pointer"
                      onClick={() => handleContextAction('react-❤️')}
                    >
                      ❤️
                    </span>
                    <span 
                      className="text-lg hover:scale-125 transition-transform duration-150 cursor-pointer"
                      onClick={() => handleContextAction('react-👍')}
                    >
                      👍
                    </span>
                    <span 
                      className="text-lg hover:scale-125 transition-transform duration-150 cursor-pointer"
                      onClick={() => handleContextAction('react-😂')}
                    >
                      😂
                    </span>
                    <span 
                      className="text-lg hover:scale-125 transition-transform duration-150 cursor-pointer"
                      onClick={() => handleContextAction('react-😮')}
                    >
                      😮
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Reply Overlay */}
            {replyingTo && (
              <>
                {/* Blur/Dark Overlay */}
                <div 
                  className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyAnimation(null);
                    // Clean up keyframe
                    const existingStyle = document.getElementById('reply-keyframes');
                    if (existingStyle) {
                      existingStyle.remove();
                    }
                  }}
                />
               
                {/* Reply Message Bubble */}
                <div className={`absolute z-50 flex ${replyingTo.own ? 'right-4 justify-end' : 'left-4 justify-start'}`} style={{ bottom: emojiPicker.show ? '238px' : '80px' }}>
                  <div 
                    style={{
                      animation: `slide-to-reply-${replyingTo.id} 0.4s cubic-bezier(0.4, 0, 0.2, 1)`
                    }}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        replyingTo.own
                          ? 'text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                      style={{
                        ...(replyingTo.own ? {background: 'linear-gradient(135deg, #3B82F6, #1E40AF)'} : {opacity: 0.8}),
                        boxShadow: replyingTo.own 
                          ? '0 2px 6px rgba(30, 64, 175, 0.6)' 
                          : '0 2px 6px rgba(0,0,0,0.12)'
                      }}
                    >
                      {replyingTo.replyTo && (
                        <div 
                          className="mt-2 mb-2 p-2 rounded border cursor-pointer"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            borderColor: 'rgba(255,255,255,0.20)' 
                          }}
                          onClick={() => handleReplyClick(replyingTo.replyTo!.id)}
                        >
                          <p className={`text-xs font-medium ${replyingTo.own ? 'text-blue-100' : 'text-gray-600'} opacity-50`}>
                            {replyingTo.replyTo.sender}
                          </p>
                          <p className={`text-xs mt-1 ${replyingTo.own ? 'text-blue-50' : 'text-gray-700'} ${replyingTo.replyTo.content === 'Nachricht gelöscht...' ? 'italic opacity-60' : ''}`} 
                             style={{ 
                               hyphens: 'auto',
                               wordBreak: 'break-word',
                               overflowWrap: 'break-word',
                               overflow: 'hidden',
                               display: '-webkit-box',
                               WebkitLineClamp: 2,
                               WebkitBoxOrient: 'vertical'
                             }}>
                            {replyingTo.replyTo.content}
                          </p>
                        </div>
                      )}
                      {/* Photo Display */}
                      {replyingTo.photo && (
                        <div className="mt-2 mb-2">
                          <img
                            src={replyingTo.photo}
                            alt="Reply photo"
                            className="w-full h-auto rounded-lg"
                            style={{ 
                              maxHeight: '300px',
                              minHeight: '120px',
                              objectFit: 'cover',
                              aspectRatio: 'auto'
                            }}
                          />
                        </div>
                      )}

                      {/* PDF Display */}
                      {replyingTo.pdf && (
                        <div 
                          className="mt-2 mb-2 rounded-lg p-3 flex items-center space-x-3 cursor-pointer transition-colors hover:bg-gray-100"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.5)',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(replyingTo.pdf, '_blank');
                          }}
                        >
                          <div className="w-10 h-12 bg-red-500 rounded flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {replyingTo.pdfName || replyingTo.pdf}
                            </div>
                            <div className="text-xs text-gray-500">
                              PDF-Dokument
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Text Content */}
                      {replyingTo.content && (
                        <p 
                          className={`text-sm ${replyingTo.content === 'Nachricht gelöscht...' ? 'italic opacity-60' : ''}`}
                          style={{ 
                            hyphens: 'auto',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                          }}
                        >
                          {replyingTo.content}
                        </p>
                      )}
                      <p className={`text-xs mt-1 ${replyingTo.own ? 'text-blue-100 text-right' : 'text-gray-500'}`} style={{ fontSize: '0.5775rem' }}>
                        {replyingTo.edited && '(edited) '}{replyingTo.time}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Edit Overlay */}
            {editingMessage && (
              <>
                {/* Blur/Dark Overlay */}
                <div 
                  className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
                  onClick={() => {
                    setEditingMessage(null);
                    setEditAnimation(null);
                    setMessageInput("");
                    // Clean up edit keyframe
                    const existingEditStyle = document.getElementById('edit-keyframes');
                    if (existingEditStyle) {
                      existingEditStyle.remove();
                    }
                  }}
                />
                
                {/* Edit Message Bubble */}
                <div className={`absolute z-50 flex ${editingMessage.own ? 'right-4 justify-end' : 'left-4 justify-start'}`} style={{ bottom: emojiPicker.show ? '238px' : '80px' }}>
                  <div 
                    style={{
                      animation: `slide-to-edit-${editingMessage.id} 0.4s cubic-bezier(0.4, 0, 0.2, 1)`
                    }}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        editingMessage.own
                          ? 'text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                      style={{
                        ...(editingMessage.own ? {background: 'linear-gradient(135deg, #3B82F6, #1E40AF)'} : {opacity: 0.8}),
                        boxShadow: editingMessage.own 
                          ? '0 2px 6px rgba(30, 64, 175, 0.6)' 
                          : '0 2px 6px rgba(0,0,0,0.12)'
                      }}
                    >
                      {editingMessage.replyTo && (
                        <div 
                          className="mt-2 mb-2 p-2 rounded border cursor-pointer"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            borderColor: 'rgba(255,255,255,0.20)' 
                          }}
                          onClick={() => handleReplyClick(editingMessage.replyTo!.id)}
                        >
                          <p className={`text-xs font-medium ${editingMessage.own ? 'text-blue-100' : 'text-gray-600'} opacity-50`}>
                            {editingMessage.replyTo.sender}
                          </p>
                          <p className={`text-xs mt-1 ${editingMessage.own ? 'text-blue-50' : 'text-gray-700'} ${editingMessage.replyTo.content === 'Nachricht gelöscht...' ? 'italic opacity-60' : ''}`} 
                             style={{ 
                               hyphens: 'auto',
                               wordBreak: 'break-word',
                               overflowWrap: 'break-word',
                               overflow: 'hidden',
                               display: '-webkit-box',
                               WebkitLineClamp: 2,
                               WebkitBoxOrient: 'vertical'
                             }}>
                            {editingMessage.replyTo.content}
                          </p>
                        </div>
                      )}
                      {/* Photo Display */}
                      {editingMessage.photo && (
                        <div className="mt-2 mb-2">
                          <img
                            src={editingMessage.photo}
                            alt="Edit photo"
                            className="w-full h-auto rounded-lg"
                            style={{ 
                              maxHeight: '300px',
                              minHeight: '120px',
                              objectFit: 'cover',
                              aspectRatio: 'auto'
                            }}
                          />
                        </div>
                      )}

                      {/* PDF Display */}
                      {editingMessage.pdf && (
                        <div 
                          className="mt-2 mb-2 rounded-lg p-3 flex items-center space-x-3 cursor-pointer transition-colors hover:bg-gray-100"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.5)',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(editingMessage.pdf, '_blank');
                          }}
                        >
                          <div className="w-10 h-12 bg-red-500 rounded flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {editingMessage.pdfName || editingMessage.pdf}
                            </div>
                            <div className="text-xs text-gray-500">
                              PDF-Dokument
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Text Content */}
                      {editingMessage.content && (
                        <p 
                          className={`text-sm ${editingMessage.content === 'Nachricht gelöscht...' ? 'italic opacity-60' : ''}`}
                          style={{ 
                            hyphens: 'auto',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                          }}
                        >
                          {editingMessage.content}
                        </p>
                      )}
                      <p className={`text-xs mt-1 ${editingMessage.own ? 'text-blue-100 text-right' : 'text-gray-500'}`} style={{ fontSize: '0.5775rem' }}>
                        {editingMessage.edited && '(edited) '}{editingMessage.time}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteDialog.show && (
              <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {deleteDialog.isBulkDelete ? 'Nachrichten löschen' : 'Nachricht löschen'}
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    {deleteDialog.isBulkDelete ? 'Wie möchten Sie die Nachrichten löschen?' : 'Wie möchten Sie die Nachricht löschen?'}
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        if (deleteDialog.isBulkDelete) {
                          // Bulk delete for me
                          if (selectedChat) {
                            setAllMessages(prev => ({
                              ...prev,
                              [selectedChat.id]: (prev[selectedChat.id] || []).filter(msg => 
                                !deleteDialog.selectedMessageIds.includes(msg.id)
                              )
                            }));
                            setIsSelectMode(false);
                            setSelectedMessages(new Set());
                          }
                        } else {
                          handleDeleteForMe();
                        }
                        // Close dialog
                        setDeleteDialog({ show: false, messageId: null, isOwnMessage: false, isBulkDelete: false, selectedMessageIds: [], hasOwnMessages: false, hasOtherMessages: false });
                      }}
                      className="w-full px-4 py-3 text-center text-sm text-gray-700 rounded-lg transition-colors border"
                      style={{
                        borderColor: 'rgba(59, 130, 246, 0.85)'
                      }}
                      onTouchStart={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div className="font-medium">Für mich löschen</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {deleteDialog.isBulkDelete 
                          ? 'Die Nachrichten werden nur für Sie entfernt'
                          : 'Die Nachricht wird nur für Sie entfernt'
                        }
                      </div>
                    </button>
                    
                    {/* Show "Delete for all" only if: single own message OR bulk with only own messages */}
                    {((deleteDialog.isBulkDelete && deleteDialog.hasOwnMessages && !deleteDialog.hasOtherMessages) || 
                      (!deleteDialog.isBulkDelete && deleteDialog.isOwnMessage)) && (
                      <button
                        onClick={() => {
                          if (deleteDialog.isBulkDelete) {
                            // Bulk delete for everyone (only own messages)
                            if (selectedChat) {
                              setAllMessages(prev => ({
                                ...prev,
                                [selectedChat.id]: (prev[selectedChat.id] || []).map(msg => 
                                  deleteDialog.selectedMessageIds.includes(msg.id) && msg.own
                                    ? { ...msg, content: 'Nachricht gelöscht...', edited: false }
                                    : msg
                                )
                              }));
                              setIsSelectMode(false);
                              setSelectedMessages(new Set());
                            }
                          } else {
                            handleDeleteForEveryone();
                          }
                          // Close dialog
                          setDeleteDialog({ show: false, messageId: null, isOwnMessage: false, isBulkDelete: false, selectedMessageIds: [], hasOwnMessages: false, hasOtherMessages: false });
                        }}
                        className="w-full px-4 py-3 text-center text-sm text-gray-700 rounded-lg transition-colors border"
                        style={{
                          borderColor: 'rgba(250, 12, 12, 0.85)'
                        }}
                        onTouchStart={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(250, 12, 12, 0.05)';
                        }}
                        onTouchEnd={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(250, 12, 12, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div className="font-medium">Für alle löschen</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {deleteDialog.isBulkDelete 
                            ? 'Die Nachrichten werden für alle entfernt'
                            : 'Die Nachricht wird für alle entfernt'
                          }
                        </div>
                      </button>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setDeleteDialog({ show: false, messageId: null, isOwnMessage: false, isBulkDelete: false, selectedMessageIds: [], hasOwnMessages: false, hasOtherMessages: false })}
                    className="w-full mt-4 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            {/* Photo Viewer */}
            {photoViewer.show && (
              <div 
                className="fixed inset-0 bg-black flex flex-col z-[9999]"
                onClick={closePhotoViewer}
                style={{ 
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100vw',
                  height: '100vh',
                  backgroundColor: 'black'
                }}
              >
                {/* Main photo display */}
                <div className="flex-1 flex items-center justify-center relative">
                  {/* Previous arrow */}
                  {photoViewer.photos.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigatePhotoViewer('prev');
                      }}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-all z-10"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  {/* Current photo */}
                  <img
                    src={photoViewer.photos[photoViewer.currentIndex]}
                    alt="Full size photo"
                    className="object-contain"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      maxWidth: 'calc(100vw - 80px)',
                      maxHeight: 'calc(100vh - 120px)',
                      width: 'auto',
                      height: 'auto'
                    }}
                  />

                  {/* Next arrow */}
                  {photoViewer.photos.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigatePhotoViewer('next');
                      }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-all z-10"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}

                  {/* Close button */}
                  <button
                    onClick={closePhotoViewer}
                    className="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Thumbnail footer */}
                <div className="h-20 bg-black bg-opacity-50 flex items-center justify-center px-4">
                  <div className="flex gap-2 overflow-x-auto max-w-full">
                    {photoViewer.photos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoViewer(prev => ({ ...prev, currentIndex: index }));
                        }}
                        className={`flex-shrink-0 w-14 h-14 rounded border-2 transition-all ${
                          index === photoViewer.currentIndex
                            ? 'border-white'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={photo}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover rounded"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

                      </div>
        ) : (
          /* Contacts List View */
          <div className="absolute inset-0 bg-white flex flex-col">
            
            {/* Header - Fixed at top */}
            <div className="p-4 pt-20 border-b border-gray-200 bg-white sticky top-0 z-20 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-xl font-semibold text-gray-800">Chats</h1>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Suche oder starte neuen Chat"
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Contacts List - Scrollable */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {sortedContacts.map((contact, index) => (
                <div
                  key={contact.id}
                  onClick={() => {
                    if (longPressTriggered) {
                      return; // Don't open chat if long press was triggered
                    }
                    setSelectedChat(contact);
                  }}
                  onTouchStart={(e) => handleContactLongPressStart(e, contact.id)}
                  onTouchEnd={handleContactLongPressEnd}
                  onTouchCancel={handleContactLongPressEnd}
                  onMouseDown={(e) => handleContactLongPressStart(e, contact.id)}
                  onMouseUp={handleContactLongPressEnd}
                  onMouseLeave={handleContactLongPressEnd}
                  className={`flex items-center p-3 m-2 cursor-pointer rounded-lg relative z-10 transition-colors duration-200 hover:bg-gray-100`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                      {contact.profileImage ? (
                        <img 
                          src={contact.profileImage} 
                          alt={contact.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-medium">{contact.name.charAt(0)}</span>
                      )}
                    </div>
                    {contact.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                      <div className="flex items-center space-x-1">
                        {contact.pinned && (
                          <Pin className="h-3 w-3 text-gray-400 opacity-50" />
                        )}
                        <span className="text-xs text-gray-500">{contact.time}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-gray-600 truncate">{contact.lastMessage}</p>
                      {(contact.unread > 0 || contact.markedUnread) && (
                        <span 
                          className="text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                          style={{background: 'linear-gradient(135deg, #3B82F6, #1E40AF)'}}
                        >
                          {contact.unread > 0 ? contact.unread : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Contact Context Menu */}
            {contactContextMenu.show && (() => {
              const currentContact = contacts.find(c => c.id === contactContextMenu.contactId);
              return (
                <div
                  className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-100"
                  style={{
                    left: contactContextMenu.x,
                    top: contactContextMenu.y,
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(10px)',
                    minWidth: '200px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                  data-contact-context-menu
                >
                  <div>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      onClick={() => {
                        if (contactContextMenu.contactId) {
                          setContacts((prev: Contact[]) => prev.map((contact: Contact) => 
                            contact.id === contactContextMenu.contactId 
                              ? { ...contact, markedUnread: !contact.markedUnread }
                              : contact
                          ));
                        }
                        closeContactContextMenu();
                      }}
                    >
                      <CircleDot className="h-4 w-4" />
                      <span>{currentContact?.markedUnread ? 'Als gelesen markieren' : 'Als ungelesen markieren'}</span>
                    </button>
                    <hr className="border-gray-100 opacity-50" />
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      onClick={() => {
                        if (contactContextMenu.contactId) {
                          setContacts((prev: Contact[]) => prev.map((contact: Contact) => 
                            contact.id === contactContextMenu.contactId 
                              ? { ...contact, pinned: !contact.pinned }
                              : contact
                          ));
                        }
                        closeContactContextMenu();
                      }}
                    >
                      <div className="relative">
                        <Pin className="h-4 w-4" />
                        {currentContact?.pinned && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-5 h-px bg-gray-700 rotate-45"></div>
                          </div>
                        )}
                      </div>
                      <span>{currentContact?.pinned ? 'Entpinnen' : 'Anheften'}</span>
                    </button>
                    <hr className="border-gray-100 opacity-50" />
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      onClick={() => {
                        setClearChatDialog({
                          show: true,
                          contactId: contactContextMenu.contactId
                        });
                        closeContactContextMenu();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Chat leeren</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Clear Chat Confirmation Dialog */}
            {clearChatDialog.show && (
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[9999] flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Chat leeren
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Sind Sie sicher, dass Sie diesen Chat leeren möchten? Alle Nachrichten werden dauerhaft gelöscht.
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        if (clearChatDialog.contactId) {
                          setAllMessages(prev => ({
                            ...prev,
                            [clearChatDialog.contactId!]: []
                          }));
                          setContacts((prev: Contact[]) => prev.map((contact: Contact) => 
                            contact.id === clearChatDialog.contactId 
                              ? { ...contact, lastMessage: "" }
                              : contact
                          ));
                        }
                        setClearChatDialog({ show: false, contactId: null });
                      }}
                      className="w-full px-4 py-3 text-center text-sm text-gray-700 rounded-lg transition-colors border"
                      style={{
                        borderColor: 'rgba(250, 12, 12, 0.85)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(250, 12, 12, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div className="font-medium">Chat leeren</div>
                      <div className="text-xs text-gray-500">
                        Alle Nachrichten werden gelöscht
                      </div>
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setClearChatDialog({ show: false, contactId: null })}
                    className="w-full mt-4 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        )}



        {/* Attachment Popup */}
        {attachmentPopup && (
          <div 
            data-attachment-popup
            className="absolute bg-white rounded-lg shadow-lg border border-gray-100 z-50"
            style={{
              bottom: '71px',
              left: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              minWidth: '160px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3 rounded-t-lg"
              onClick={() => {
                document.getElementById('photo-input')?.click();
                setAttachmentPopup(false);
              }}
            >
              <Image className="h-4 w-4" />
              <span>Foto</span>
            </button>
            <button
              className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3 rounded-b-lg"
              onClick={() => {
                document.getElementById('pdf-input')?.click();
                setAttachmentPopup(false);
              }}
            >
              <FileText className="h-4 w-4" />
              <span>PDF</span>
            </button>
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          id="photo-input"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                setPhotoEditor({
                  show: true,
                  image: imageUrl,
                  caption: '',
                  rotation: 0,
                  cropMode: false,
                  crop: null
                });
              };
              reader.readAsDataURL(file);
            }
            e.target.value = '';
          }}
        />
        <input
          id="pdf-input"
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setPdfEditor({
                show: true,
                file: file,
                caption: ''
              });
            }
            e.target.value = '';
          }}
        />

        {/* Photo Editor Card */}
        {photoEditor && (
          <div 
            data-photo-editor
            className="fixed inset-0 bg-black z-50 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between p-4 pt-20">
              {/* Close Button */}
              <button
                onClick={() => setPhotoEditor(null)}
                className="w-10 h-10 rounded-full bg-gray-800 bg-opacity-50 flex items-center justify-center"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              
              {/* Editing Tools */}
              <div className="flex items-center space-x-4">
                <button 
                  className="w-10 h-10 rounded-full bg-gray-800 bg-opacity-50 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    saveToHistory();
                    setPhotoEditor(prev => prev ? {
                      ...prev,
                      rotation: prev.rotation + 90
                    } : null);
                  }}
                >
                  <RotateCw className="w-5 h-5 text-white" />
                </button>

                <button 
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    photoEditor.cropMode ? 'bg-blue-500' : 'bg-gray-800 bg-opacity-50'
                  }`}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (photoEditor) {
                      if (photoEditor.cropMode) {
                        // Submit crop and disable crop mode
                        if (photoEditor.crop) {
                          saveToHistory();
                          try {
                            const croppedImage = await combineImageWithDrawings(
                              photoEditor.image,
                              drawingPaths,
                              photoEditor.rotation,
                              photoEditor.crop
                            );
                            
                            setPhotoEditor(prev => prev ? {
                              ...prev,
                              image: croppedImage,
                              cropMode: false,
                              crop: null,
                              rotation: 0
                            } : null);
                            
                            // Clear drawing paths since they're now applied to the image
                            setDrawingPaths([]);
                          } catch (error) {
                            console.error('Failed to apply crop:', error);
                            // Fallback: just disable crop mode
                            setPhotoEditor(prev => prev ? {
                              ...prev,
                              cropMode: false
                            } : null);
                          }
                        } else {
                          // No crop defined, just disable crop mode
                          setPhotoEditor(prev => prev ? {
                            ...prev,
                            cropMode: false
                          } : null);
                        }
                      } else {
                        // Enable crop mode with default selection
                        saveToHistory();
                        setPhotoEditor(prev => prev ? {
                          ...prev,
                          cropMode: true,
                          crop: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 }
                        } : null);
                      }
                    }
                  }}
                >
                  <Crop className="w-5 h-5 text-white" />
                </button>
                <button 
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    colorPalette.selectedColor ? 'bg-blue-500' : 'bg-gray-800 bg-opacity-50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (colorPalette.selectedColor) {
                      // Deselect if already selected
                      setColorPalette({ show: false, selectedColor: '' });
                    } else {
                      // Show palette to select color
                      setColorPalette(prev => ({ ...prev, show: !prev.show }));
                    }
                  }}
                >
                  <Pen className="w-5 h-5 text-white" />
                </button>
                <button 
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    eraserPalette.selectedSize > 0 ? 'bg-blue-500' : 'bg-gray-800 bg-opacity-50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (eraserPalette.selectedSize > 0) {
                      // Deselect if already selected
                      setEraserPalette({ show: false, selectedSize: 0 });
                    } else {
                      // Show palette to select size
                      setEraserPalette(prev => ({ ...prev, show: !prev.show }));
                    }
                  }}
                >
                  <Eraser className="w-5 h-5 text-white" />
                </button>
                <button 
                  className="w-10 h-10 rounded-full bg-gray-800 bg-opacity-50 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={(e) => {
                    e.stopPropagation();
                    undoLastChange();
                  }}
                  disabled={undoHistory.length === 0}
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Color Palette */}
            {colorPalette.show && (
              <div 
                data-color-palette
                className="absolute bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50"
                style={{ 
                  top: '80px',
                  left: '16px',
                  right: '16px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-8 gap-1.5">
                  {['#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF', '#8B4513', '#A52A2A', '#800000',
                    '#FF0000', '#FF6347', '#FFA500', '#FFD700', '#FFFF00', '#32CD32', '#00FF00', '#006400',
                    '#00FFFF', '#40E0D0', '#0000FF', '#4169E1', '#800080', '#9370DB', '#FF00FF', '#FF1493'].map((color) => (
                    <button
                      key={color}
                      className={`w-5 h-5 rounded-md hover:scale-110 transition-transform ${
                        color === '#FFFFFF' ? 'border border-gray-200' : ''
                      } ${
                        colorPalette.selectedColor === color ? 'scale-125' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setColorPalette({ show: false, selectedColor: color });
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Eraser Size Palette */}
            {eraserPalette.show && (
              <div 
                data-eraser-palette
                className="absolute bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50"
                style={{ 
                  top: '130px',
                  left: '16px',
                  right: '16px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-6 gap-2 items-center justify-items-center">
                  {[5, 10, 15, 20, 25, 30].map((size) => (
                    <button
                      key={size}
                      className={`rounded-full bg-black/90 hover:scale-110 transition-transform ${
                        eraserPalette.selectedSize === size ? 'scale-125' : ''
                      }`}
                      style={{ 
                        width: `${Math.max(8, size)}px`, 
                        height: `${Math.max(8, size)}px` 
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEraserPalette({ show: false, selectedSize: size });
                        setColorPalette({ show: false, selectedColor: '' });
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Photo Display */}
            <div className={`flex-1 flex items-center justify-center px-4 relative ${photoEditor.rotation % 180 === 90 ? 'flex-col' : ''}`}>
              <div className="relative">
                <div 
                  className="relative bg-transparent"
                  style={{
                    transform: `rotate(${photoEditor.rotation}deg)`,
                    transformOrigin: 'center',
                    width: photoEditor.rotation % 180 === 90 ? '300px' : 'auto',
                    height: photoEditor.rotation % 180 === 90 ? '300px' : 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={photoEditor.image}
                    alt="Preview"
                    className={photoEditor.rotation % 180 === 90 ? "max-w-full max-h-full object-contain" : "max-w-full max-h-full object-contain"}
                    id="crop-image"
                  />

                  {/* Drawing Canvas */}
                <svg 
                  className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                  style={{ 
                    pointerEvents: (colorPalette.selectedColor || eraserPalette.selectedSize) ? 'auto' : 'none',
                    cursor: eraserPalette.selectedSize > 0 ? 
                      `url("data:image/svg+xml,%3csvg width='${eraserPalette.selectedSize}' height='${eraserPalette.selectedSize}' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='${eraserPalette.selectedSize/2}' cy='${eraserPalette.selectedSize/2}' r='${eraserPalette.selectedSize/2-1}' fill='none' stroke='%23666' stroke-width='1'/%3e%3c/svg%3e") ${eraserPalette.selectedSize/2} ${eraserPalette.selectedSize/2}, auto` : 
                      'crosshair'
                  }}
                  onMouseDown={(e) => {
                    if (!colorPalette.selectedColor && !eraserPalette.selectedSize) return;
                    saveToHistory();
                    setIsDrawing(true);
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    if (colorPalette.selectedColor) {
                      // Drawing mode
                      setDrawingPaths(prev => [...prev, { color: colorPalette.selectedColor, points: [{ x, y }] }]);
                    } else if (eraserPalette.selectedSize) {
                      // Erasing mode - remove paths that intersect with eraser area
                      const eraserRadius = eraserPalette.selectedSize / 2;
                      setDrawingPaths(prev => {
                        const newPaths: Array<{ color: string; points: Array<{ x: number; y: number }> }> = [];
                        prev.forEach(path => {
                          const segments: Array<Array<{ x: number; y: number }>> = [];
                          let currentSegment: Array<{ x: number; y: number }> = [];
                          
                          path.points.forEach(point => {
                            const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
                            
                            if (distance > eraserRadius) {
                              currentSegment.push(point);
                            } else {
                              // Point is within eraser, end current segment
                              if (currentSegment.length > 1) {
                                segments.push([...currentSegment]);
                              }
                              currentSegment = [];
                            }
                          });
                          
                          // Add final segment if it exists
                          if (currentSegment.length > 1) {
                            segments.push(currentSegment);
                          }
                          
                          // Create new paths for each segment
                          segments.forEach(segment => {
                            if (segment.length > 1) {
                              newPaths.push({ ...path, points: segment });
                            }
                          });
                        });
                        
                        return newPaths;
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    if (!isDrawing) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    if (colorPalette.selectedColor) {
                      // Drawing mode
                      setDrawingPaths(prev => {
                        const newPaths = [...prev];
                        newPaths[newPaths.length - 1].points.push({ x, y });
                        return newPaths;
                      });
                    } else if (eraserPalette.selectedSize) {
                      // Erasing mode - continuously remove paths that intersect with eraser area
                      const eraserRadius = eraserPalette.selectedSize / 2;
                      setDrawingPaths(prev => {
                        const newPaths: Array<{ color: string; points: Array<{ x: number; y: number }> }> = [];
                        prev.forEach(path => {
                          const segments: Array<Array<{ x: number; y: number }>> = [];
                          let currentSegment: Array<{ x: number; y: number }> = [];
                          
                          path.points.forEach(point => {
                            const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
                            
                            if (distance > eraserRadius) {
                              currentSegment.push(point);
                            } else {
                              // Point is within eraser, end current segment
                              if (currentSegment.length > 1) {
                                segments.push([...currentSegment]);
                              }
                              currentSegment = [];
                            }
                          });
                          
                          // Add final segment if it exists
                          if (currentSegment.length > 1) {
                            segments.push(currentSegment);
                          }
                          
                          // Create new paths for each segment
                          segments.forEach(segment => {
                            if (segment.length > 1) {
                              newPaths.push({ ...path, points: segment });
                            }
                          });
                        });
                        
                        return newPaths;
                      });
                    }
                  }}
                  onMouseUp={() => setIsDrawing(false)}
                  onMouseLeave={() => setIsDrawing(false)}
                >
                  {drawingPaths.map((path, pathIndex) => (
                    <path
                      key={pathIndex}
                      d={`M ${path.points.map(p => `${p.x},${p.y}`).join(' L ')}`}
                      stroke={path.color}
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </svg>
                
                  {/* Crop Lines Overlay */}
                {photoEditor.cropMode && photoEditor.crop && (
                  <div className="absolute inset-0">
                    {/* Crop rectangle outline */}
                    <div 
                      className="absolute border-2 border-white shadow-lg pointer-events-none"
                      style={{
                        top: `${photoEditor.crop.y * 100}%`,
                        left: `${photoEditor.crop.x * 100}%`,
                        width: `${photoEditor.crop.width * 100}%`,
                        height: `${photoEditor.crop.height * 100}%`
                      }}
                    />
                    
                    {/* Corner handles */}
                    {(() => {
                      const createDragHandler = (type: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r') => (e: React.MouseEvent) => {
                        e.preventDefault();
                        if (!photoEditor?.crop) return;
                        
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startCrop = {...photoEditor.crop};
                        const photoElement = (e.currentTarget as HTMLElement).parentElement as HTMLElement;
                        
                        const handleMouseMove = (e: MouseEvent) => {
                          const rect = photoElement?.getBoundingClientRect();
                          if (!rect) return;
                          
                          const deltaX = (e.clientX - startX) / rect.width;
                          const deltaY = (e.clientY - startY) / rect.height;
                          
                          let newCrop = {...startCrop};
                          
                          if (type === 'tl') {
                            const newX = Math.max(0, Math.min(startCrop.x + deltaX, startCrop.x + startCrop.width - 0.1));
                            const newY = Math.max(0, Math.min(startCrop.y + deltaY, startCrop.y + startCrop.height - 0.1));
                            newCrop = {
                              x: newX,
                              y: newY,
                              width: startCrop.width - (newX - startCrop.x),
                              height: startCrop.height - (newY - startCrop.y)
                            };
                          } else if (type === 'tr') {
                            const newY = Math.max(0, Math.min(startCrop.y + deltaY, startCrop.y + startCrop.height - 0.1));
                            const newWidth = Math.max(0.1, Math.min(1 - startCrop.x, startCrop.width + deltaX));
                            newCrop = {
                              x: startCrop.x,
                              y: newY,
                              width: newWidth,
                              height: startCrop.height - (newY - startCrop.y)
                            };
                          } else if (type === 'bl') {
                            const newX = Math.max(0, Math.min(startCrop.x + deltaX, startCrop.x + startCrop.width - 0.1));
                            const newHeight = Math.max(0.1, Math.min(1 - startCrop.y, startCrop.height + deltaY));
                            newCrop = {
                              x: newX,
                              y: startCrop.y,
                              width: startCrop.width - (newX - startCrop.x),
                              height: newHeight
                            };
                          } else if (type === 'br') {
                            const newWidth = Math.max(0.1, Math.min(1 - startCrop.x, startCrop.width + deltaX));
                            const newHeight = Math.max(0.1, Math.min(1 - startCrop.y, startCrop.height + deltaY));
                            newCrop = {
                              x: startCrop.x,
                              y: startCrop.y,
                              width: newWidth,
                              height: newHeight
                            };
                          } else if (type === 't') {
                            const newY = Math.max(0, Math.min(startCrop.y + deltaY, startCrop.y + startCrop.height - 0.1));
                            newCrop = {
                              ...startCrop,
                              y: newY,
                              height: startCrop.height - (newY - startCrop.y)
                            };
                          } else if (type === 'b') {
                            const newHeight = Math.max(0.1, Math.min(1 - startCrop.y, startCrop.height + deltaY));
                            newCrop = {
                              ...startCrop,
                              height: newHeight
                            };
                          } else if (type === 'l') {
                            const newX = Math.max(0, Math.min(startCrop.x + deltaX, startCrop.x + startCrop.width - 0.1));
                            newCrop = {
                              ...startCrop,
                              x: newX,
                              width: startCrop.width - (newX - startCrop.x)
                            };
                          } else if (type === 'r') {
                            const newWidth = Math.max(0.1, Math.min(1 - startCrop.x, startCrop.width + deltaX));
                            newCrop = {
                              ...startCrop,
                              width: newWidth
                            };
                          }
                          
                          setPhotoEditor(prev => prev ? ({
                            ...prev,
                            crop: newCrop
                          }) : prev);
                        };
                        
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      };
                      
                      return (
                        <>
                          {/* Top-left */}
                          <div 
                            className="absolute w-3 h-3 bg-white border border-gray-400 cursor-nw-resize z-10"
                            style={{
                              top: `${photoEditor.crop.y * 100}%`,
                              left: `${photoEditor.crop.x * 100}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                            onMouseDown={createDragHandler('tl')}
                          />
                          {/* Top-right */}
                          <div 
                            className="absolute w-3 h-3 bg-white border border-gray-400 cursor-ne-resize z-10"
                            style={{
                              top: `${photoEditor.crop.y * 100}%`,
                              left: `${(photoEditor.crop.x + photoEditor.crop.width) * 100}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                            onMouseDown={createDragHandler('tr')}
                          />
                          {/* Bottom-left */}
                          <div 
                            className="absolute w-3 h-3 bg-white border border-gray-400 cursor-sw-resize z-10"
                            style={{
                              top: `${(photoEditor.crop.y + photoEditor.crop.height) * 100}%`,
                              left: `${photoEditor.crop.x * 100}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                            onMouseDown={createDragHandler('bl')}
                          />
                          {/* Bottom-right */}
                          <div 
                            className="absolute w-3 h-3 bg-white border border-gray-400 cursor-se-resize z-10"
                            style={{
                              top: `${(photoEditor.crop.y + photoEditor.crop.height) * 100}%`,
                              left: `${(photoEditor.crop.x + photoEditor.crop.width) * 100}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                            onMouseDown={createDragHandler('br')}
                          />
                          
                          {/* Side handles */}
                          {/* Top */}
                          <div 
                            className="absolute w-3 h-2 bg-white border border-gray-400 cursor-n-resize z-10"
                            style={{
                              top: `${photoEditor.crop.y * 100}%`,
                              left: `${(photoEditor.crop.x + photoEditor.crop.width / 2) * 100}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                            onMouseDown={createDragHandler('t')}
                          />
                          {/* Bottom */}
                          <div 
                            className="absolute w-3 h-2 bg-white border border-gray-400 cursor-s-resize z-10"
                            style={{
                              top: `${(photoEditor.crop.y + photoEditor.crop.height) * 100}%`,
                              left: `${(photoEditor.crop.x + photoEditor.crop.width / 2) * 100}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                            onMouseDown={createDragHandler('b')}
                          />
                          {/* Left */}
                          <div 
                            className="absolute w-2 h-3 bg-white border border-gray-400 cursor-w-resize z-10"
                            style={{
                              top: `${(photoEditor.crop.y + photoEditor.crop.height / 2) * 100}%`,
                              left: `${photoEditor.crop.x * 100}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                            onMouseDown={createDragHandler('l')}
                          />
                          {/* Right */}
                          <div 
                            className="absolute w-2 h-3 bg-white border border-gray-400 cursor-e-resize z-10"
                            style={{
                              top: `${(photoEditor.crop.y + photoEditor.crop.height / 2) * 100}%`,
                              left: `${(photoEditor.crop.x + photoEditor.crop.width) * 100}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                            onMouseDown={createDragHandler('r')}
                          />
                        </>
                      );
                    })()}
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Bottom Caption Area */}
            <div className="p-4 pb-8">
              <div className="flex items-center space-x-3 bg-gray-900 bg-opacity-80 rounded-full px-4 py-3">
                <input
                  type="text"
                  placeholder="Add a caption..."
                  value={photoEditor.caption}
                  onChange={(e) => setPhotoEditor(prev => prev ? { ...prev, caption: e.target.value } : null)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 text-white bg-transparent outline-none placeholder-gray-400 text-sm"
                />
                <Smile 
                  data-emoji-trigger
                  className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white transition-colors flex-shrink-0" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEmojiPicker(prev => ({ 
                      ...prev, 
                      show: !prev.show, 
                      context: 'photo' 
                    }));
                  }}
                />
                <button
                  onClick={async () => {
                    if (selectedChat && photoEditor) {
                      let finalImage = photoEditor.image;
                      
                      // Apply drawings and rotation if any exist
                      if (drawingPaths.length > 0 || photoEditor.rotation !== 0) {
                        finalImage = await combineImageWithDrawings(photoEditor.image, drawingPaths, photoEditor.rotation);
                      }
                      
                      const newMessage: Message = {
                        id: Date.now(),
                        sender: 'Du',
                        content: photoEditor.caption || '',
                        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
                        own: true,
                        photo: finalImage
                      };

                      setAllMessages(prev => ({
                        ...prev,
                        [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage]
                      }));

                      setPhotoEditor(null);
                      setDrawingPaths([]);
                      setColorPalette({ show: false, selectedColor: '' });
                      setEraserPalette({ show: false, selectedSize: 0 });
                      
                      // Ensure scrolling happens after message is rendered
                      setTimeout(() => {
                        scrollToBottom();
                      }, 50);
                    }
                  }}
                  className="p-2 rounded-full text-white flex-shrink-0"
                  style={{background: 'linear-gradient(135deg, #3B82F6, #1E40AF)'}}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Editor Full Screen */}
        {pdfEditor && (
          <div 
            data-pdf-editor
            className="fixed inset-0 bg-black z-50 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between p-4 pt-20">
              {/* Close Button */}
              <button
                onClick={() => setPdfEditor(null)}
                className="w-10 h-10 rounded-full bg-gray-800 bg-opacity-50 flex items-center justify-center"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              
              {/* Empty space for symmetry */}
              <div></div>
            </div>

            {/* PDF Display */}
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="flex flex-col items-center text-center">
                {/* PDF Icon */}
                <FileText className="w-24 h-24 text-red-500 mb-6" />
                
                {/* PDF Info */}
                <div className="text-lg font-medium text-white mb-2 truncate max-w-[280px]">
                  {pdfEditor.file.name}
                </div>
                <div className="text-sm text-gray-300">
                  {(pdfEditor.file.size / (1024 * 1024)).toFixed(1)} MB, PDF-Dokument
                </div>
              </div>
            </div>

            {/* Bottom Caption Area */}
            <div className="p-4 pb-8">
              <div className="flex items-center space-x-3 bg-gray-800 bg-opacity-50 rounded-full px-4 py-3">
                <Smile 
                  data-emoji-trigger
                  className="w-6 h-6 text-gray-300 cursor-pointer hover:text-white transition-colors flex-shrink-0" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEmojiPicker(prev => ({ 
                      ...prev, 
                      show: !prev.show, 
                      context: 'pdf' 
                    }));
                  }}
                />
                <input
                  type="text"
                  placeholder="Nachricht hinzufügen..."
                  value={pdfEditor.caption}
                  onChange={(e) => setPdfEditor(prev => prev ? { ...prev, caption: e.target.value } : null)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 text-white bg-transparent outline-none placeholder-gray-300 py-1"
                />
                <button
                  onClick={() => {
                    if (selectedChat && pdfEditor) {
                      const pdfUrl = URL.createObjectURL(pdfEditor.file);
                      const newMessage: Message = {
                        id: Date.now(),
                        sender: 'Du',
                        content: pdfEditor.caption || '',
                        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
                        own: true,
                        pdf: pdfUrl,
                        pdfName: pdfEditor.file.name
                      };

                      setAllMessages(prev => ({
                        ...prev,
                        [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage]
                      }));

                      setPdfEditor(null);
                      
                      // Ensure scrolling happens after message is rendered
                      setTimeout(() => {
                        scrollToBottom();
                      }, 50);
                    }
                  }}
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center flex-shrink-0"
                  style={{background: 'linear-gradient(135deg, #3B82F6, #1E40AF)'}}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Clear Chat Dialog */}
        {clearChatDialog.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
              <h3 className="text-lg font-medium mb-4">Chat leeren</h3>
              <p className="text-gray-600 mb-6">
                Möchtest du alle Nachrichten in diesem Chat löschen?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setClearChatDialog({ show: false, contactId: null })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    setClearChatDialog({ show: false, contactId: null });
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}