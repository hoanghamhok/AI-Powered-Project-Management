#React query là thư viện quản lí dữ liệu lấy từ server :tự động fetch dữ liệu,có sẵn loading,error,cache,tự biết khi nào refetch
#JWT = dữ liệu + chữ ký → để server tin mà không cần lưu session.
        token dùng để xác thực,chứa thông tin user và được kí bằng secret_key để ko bị giả mạo.
        Cơ chế stateless, server không lưu session mà verify token ở mỗi request.

#Promise<void> Dùng khi function async chỉ làm hành động, không cần trả dữ liệu:lưu,xóa,log,side effect

#google login:
[ React Client ]
        |
        | 1. Click Login 
        ↓
[ Google OAuth Server ]
        |
        | 2. Redirect về NestJS 
        ↓
[ NestJS Backend ]
        |
        | 3. Verify Google user
        | 4. Tạo / tìm user DB
        | 5. Tạo JWT
        ↓
[ React Client ]
        |
        | 6. Nhận JWT → gọi API

#login bth:
        React → gửi email/password
                ↓
        NestJS → kiểm tra user
                ↓
        So sánh password
                ↓
        Tạo JWT
                ↓
        Trả về client
                ↓
        Client dùng JWT cho các request sau

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
        .mount:component được tạo ra và render lần đầu tiên vào DOM(khi xuất hiện trên giao diện lần đầu)

#thứ tự viết SQL:select from join where groupby having orderby
        thực hiện:from where grby having select orderby
    
#useState:tạo và quản lí trạng thái trong function component,state thay đổi -> component re-render

#useContext:cho phép component truy cập và sử dụng dữ liệu được chia sẻ mà không cần truyền props qua nhiều cấp component

#setNoderef:dùng để gắn DOM element vào hệ thống drag and drop,cho biết element nào đang được kéo thả

#Redux   User click "+"
            ↓
    dispatch({ type: "INCREASE" })
            ↓
    Reducer:
    count + 1
            ↓
    Store:
    count = 1
            ↓
    UI:
    hiển thị "1"
gồm store:kho dữ liệu,action:yêu cầu thay đổi,reducer:người xử lí(nhận state hiện tại và action=> trả về state mới)
Middleware = nơi “chặn / xử lý / chỉnh sửa / log / làm async” action trước khi reducer nhận nó.

#React.memo:chỉ so sánh props bằng references
    bình thường component cha re-render => con re render
    memo => props ko đổi thì reuse 0 re render
    . truyền function inline => mỗi lần render tạo function mới => react.memo không tác dụng

#UseCallback:giữ lại references của function.=>react.memo so sánh props
            sử dụng without react memo khi dùng cho dependency của useEffect

#dumb component:KHÔNG gọi api,bussiness logic(mapping api,xử lí data lớn),state phức tạp(form lớn,workflow),biết về backend structure
                CÓ     render data,state nhỏ (open/close,toogle edit),gọi callback từ props

#side effect:hành động tác động ra phạm vi ngoài thân hàm component,làm thay đổi một cái j đó không lq đến tính toán UI
            gọi API,DOM thủ công,event listener,consolelog để debug,
            react re render thường xuyên => để trong thân hàm sẽ chạy mỗi khi component render => sinh ra useEffect



#tx là transaction client-một phiên bản đặc biệt của prisma,đảm bảo mọi query
bên trong cùng 1 transaction

#Portal:render component ra chỗ khác DOM -createPortal(<Modal />, document.body)

#useRef tạo ra một đối tượng tham chiếu (ref object) có thể thay đổi và tồn tại xuyên suốt vòng đời của comp, ngay cả khi re-render. dùng để truy cập trực tiếp DOM hoặc lưu trữ các giá trị mà khi thay đổi ko re render

#dữ liệu thay đổi nhưng id không đổi => không re render

#lỗi phát sinh từ API (mời thành viên,sửa project...) nên được quản lý tập trung thay vì tự render một thanh thông báo lỗi thủ công trong header.nó làm header nhẹ hơn.

#over-flow:kiểm soát nội dung hiển thị

#context:truyền dẽ liệu từ cha xuống con mà ko cần props
        1.cần share gì(state hoặc function hoặc cả 2):user,login()...
        2.Provider:giữ state,logic,hành vi
        3.custom hook:export function useAuth() {
                        const context = useContext(AuthContext);...
        

#useReducer:const [state, dispatch] = useReducer(reducer, initialState);
        state:dữ liệu hiện tại
        dispatch:hàm gửi action
        reducer:hàm xử lí logic cập nhật state:reducer(state,action)
                        state:trạng thái hienj tại
                        action:điều muốn làm
        initialState:giá trị ban đầu

#zustand không cần provider vì nó tạo ra biến global dùng chung không trong cây component,giống như việc import 1 file JS bình thường (không truyền xuống).