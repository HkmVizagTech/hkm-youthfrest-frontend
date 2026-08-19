import { useEffect } from 'react';

const GROUP_LINKS = {
  g: 'https://chat.whatsapp.com/LjoVMBea73c1TtM358MNt0',
  b: 'https://chat.whatsapp.com/IanhUm6sUsU3OR3HrdRKFC',
};

function JoinRedirect({ gender }) {
  const target = GROUP_LINKS[gender] || GROUP_LINKS.b;
  useEffect(() => {
    window.location.replace(target);
  }, [target]);
  return null;
}

export default JoinRedirect;
