#React query là thư viện quản lí dữ liệu lấy từ server :tự động fetch dữ liệu,có sẵn loading,error,cache,tự biết khi nào refetch
#flow google login:

#promise trong js:là một object đại diện cho một kết quả của thao tác bất đồng bộ,kết quả này có thể có trong tương lai hoặc lỗi.
    gồm 3 trạng thái:fullfilled,reject,pending
        .then luôn trả về 1 promise mới:mỗi .then nhận kết quả từ promise trước->xử lí->trả về promise mới
            promise resolve -> .then chạy
            .then trả về giá trị thường ->
#async:a function that declared with async always return Promise
    await:tạm dừng việc thực thi hàm async cho đến khi promise được resolve hoặc reject

#useEffect có 3 loại
    []:callback được gọi một lân khi component được mount
    [dep]:callback được gọi lại mỗi khi dependency thay đổi
    0/:callback được gọi mỗi khi component rerender,luôn được gọi sau khi component thêm element vào DOM.

#thứ tự viết SQL:select from join where groupby having orderby
        thực hiện:from where grby having select orderby
    
#useState:tạo và quản lí trạng thái trong function component,state thay đổi -> component re-render

#useContext:cho phép component truy cập và sử dụng dữ liệu được chia sẻ mà không cần truyền props qua nhiều cấp component

#