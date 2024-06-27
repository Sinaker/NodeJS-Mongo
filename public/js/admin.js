const deleteProduct = (btn) => {
  const prodID = btn.parentElement.querySelector('[name="productId"]').value;
  const csrfToken = btn.parentElement.querySelector('[name="_csrf"]').value;
  const card = btn.parentElement.parentElement;
  //You can also use btn.closest('article') and this will return the closest ancestor which is of type 'article'

  fetch("/admin/product/delete/" + prodID, {
    method: "DELETE",
    headers: { "csrf-token": csrfToken },
  })
    .then((result) => card.remove())
    .catch((err) => console.log(err));
};
