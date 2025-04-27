document.addEventListener("DOMContentLoaded", function() {
    /* Dynamic background animations
    const body = document.body;
    let backgroundImages = [
      "https://www.transparenttextures.com/patterns/cubes.png",
      "https://www.transparenttextures.com/patterns/azul-tiles.png",
      "https://www.transparenttextures.com/patterns/diagonal-stripes.png"
    ];*/
  
    let index = 0;
    setInterval(function() {
      body.style.backgroundImage = `url(${backgroundImages[index]})`;
      index = (index + 1) % backgroundImages.length;
    }, 5000); // Change background every 5 seconds
  
    console.log("Website Loaded");
  });
  
  document.addEventListener("DOMContentLoaded", function() {
    // Function to toggle the description visibility
    function toggleDescription(phase) {
      const description = document.getElementById(`${phase}-description`);
      
      // Check if the description exists
      if (description) {
        // Toggle the 'show' class on the clicked phase's description
        description.classList.toggle('show');
      }
    }
  
    // Make the function available globally
    window.toggleDescription = toggleDescription;
  });
  
  